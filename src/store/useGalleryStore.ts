// src/store/useGalleryStore.ts

import { create } from 'zustand';
import {
    addImage,
    removeImage,
    setGalleryFlags
} from '../services/gallery';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type {
    CreateGalleryPayload,
    GalleryFlags,
    GalleryImage
} from '../types/gallery';
import { useAuthStore } from './useAuthStore';

interface GalleryState {
    images: GalleryImage[];
    loading: boolean;
    fetchImages: () => Promise<void>;
    addImage: (payload: CreateGalleryPayload) => Promise<boolean>;
    removeImage: (id: string) => Promise<boolean>;
    setFlags: (id: string, flags: GalleryFlags) => Promise<void>;
    reset: () => void;
}

const hydrateImages = async (images: readonly GalleryImage[]): Promise<GalleryImage[]> => {
    const context = useAuthStore.getState().getTenantContext();

    if (!context) {
        return [...images];
    }

    return Promise.all(images.map(async (image) => ({
        ...image,
        cachedImageUrl: await cacheRemoteMedia(context, 'gallery', image.imageUrl)
    })));
};

const upsertImage = (
    images: readonly GalleryImage[],
    incoming: GalleryImage
): GalleryImage[] => {
    const existing = images.find((image) => image.id === incoming.id);
    const merged = existing
        ? {
            ...existing,
            ...incoming,
            cachedImageUrl: incoming.cachedImageUrl ?? (
                existing.imageUrl === incoming.imageUrl
                    ? existing.cachedImageUrl
                    : null
            )
        }
        : incoming;

    return existing
        ? images.map((image) => image.id === incoming.id ? merged : image)
        : [merged, ...images];
};

export const useGalleryStore = create<GalleryState>((set) => {
    const syncImages = async (showLoading: boolean): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        if (showLoading) {
            set({ loading: true });
        }

        try {
            const result = await syncCacheFirst<readonly GalleryImage[]>({
                context,
                resource: 'gallery',
                path: '/gallery',
                ttlMs: CACHE_TTL_MS.gallery,
                onData: (data) => set({ images: [...data] })
            });
            const rawImages = [...result.data];
            set({ images: rawImages });

            hydrateImages(rawImages)
                .then((hydrated) => set((state) => ({
                    images: hydrated.reduce<GalleryImage[]>(
                        (current, image) => upsertImage(current, image),
                        state.images
                    )
                })))
                .catch(() => undefined);
        } finally {
            if (showLoading) {
                set({ loading: false });
            }
        }
    };

    const refreshInBackground = (): void => {
        syncImages(false).catch(() => undefined);
    };

    const hydrateImageInBackground = (image: GalleryImage): void => {
        hydrateImages([image])
            .then(([hydrated]) => set((state) => ({
                images: upsertImage(state.images, hydrated)
            })))
            .catch(() => undefined);
    };

    return {
        images: [],
        loading: false,

        fetchImages: () => syncImages(true),

        addImage: async (payload) => {
            set({ loading: true });

            try {
                const created = await addImage(payload);
                set((state) => ({ images: upsertImage(state.images, created) }));
                hydrateImageInBackground(created);
                refreshInBackground();
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },

        removeImage: async (id) => {
            try {
                await removeImage(id);
                set((state) => ({
                    images: state.images.filter((image) => image.id !== id)
                }));
                refreshInBackground();
                return true;
            } catch {
                return false;
            }
        },

        setFlags: async (id, flags) => {
            const updated = await setGalleryFlags(id, flags);
            set((state) => ({ images: upsertImage(state.images, updated) }));
            refreshInBackground();
        },

        reset: () => set({ images: [], loading: false })
    };
});
