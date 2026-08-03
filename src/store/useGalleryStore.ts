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
    if (!context) return [...images];

    return Promise.all(images.map(async (image) => ({
        ...image,
        cachedImageUrl: await cacheRemoteMedia(context, 'gallery', image.imageUrl)
    })));
};

export const useGalleryStore = create<GalleryState>((set, get) => ({
    images: [],
    loading: false,

    fetchImages: async () => {
        const context = useAuthStore.getState().getTenantContext();
        if (!context) return;
        set({ loading: true });

        try {
            const result = await syncCacheFirst<readonly GalleryImage[]>({
                context,
                resource: 'gallery',
                path: '/gallery',
                ttlMs: CACHE_TTL_MS.gallery,
                onData: (data) => set({ images: [...data] })
            });
            set({ images: await hydrateImages(result.data) });
        } finally {
            set({ loading: false });
        }
    },

    addImage: async (payload) => {
        set({ loading: true });
        try {
            await addImage(payload);
            await get().fetchImages();
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
            await get().fetchImages();
            return true;
        } catch {
            return false;
        }
    },

    setFlags: async (id, flags) => {
        await setGalleryFlags(id, flags);
        await get().fetchImages();
    },

    reset: () => set({ images: [], loading: false })
}));
