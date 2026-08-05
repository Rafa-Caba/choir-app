// src/store/useGalleryStore.ts

import { create } from 'zustand';
import {
    addImage,
    getAllImages,
    removeImage,
    setGalleryFlags
} from '../services/gallery';
import type {
    CreateGalleryPayload,
    GalleryFlags,
    GalleryImage
} from '../types/gallery';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { removeById, upsertById } from '../query/cacheUpdates';

interface GalleryState {
    images: GalleryImage[];
    loading: boolean;
    fetchImages: () => Promise<void>;
    addImage: (payload: CreateGalleryPayload) => Promise<boolean>;
    removeImage: (id: string) => Promise<void>;
    setFlags: (id: string, flags: GalleryFlags) => Promise<void>;
    reset: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
    images: [],
    loading: false,

    fetchImages: async () => {
        const scope = getTenantQueryScopeSnapshot();

        if (!scope.enabled) {
            return;
        }

        set({ loading: true });
        try {
            const images = await queryClient.fetchQuery({
                queryKey: queryKeys.gallery(scope.tenantKey),
                queryFn: getAllImages,
                staleTime: 30_000
            });
            set({ images: [...images] });
        } finally {
            set({ loading: false });
        }
    },

    addImage: async (payload) => {
        const scope = getTenantQueryScopeSnapshot();
        set({ loading: true });
        try {
            const created = await addImage(payload);
            const updated = upsertById(
                queryClient.getQueryData<readonly GalleryImage[]>(queryKeys.gallery(scope.tenantKey)),
                created
            );
            queryClient.setQueryData(queryKeys.gallery(scope.tenantKey), updated);
            set({ images: [...updated] });
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeImage: async (id) => {
        const scope = getTenantQueryScopeSnapshot();
        await removeImage(id);
        const updated = removeById(
            queryClient.getQueryData<readonly GalleryImage[]>(queryKeys.gallery(scope.tenantKey)),
            id
        );
        queryClient.setQueryData(queryKeys.gallery(scope.tenantKey), updated);
        set({ images: [...updated] });
    },

    setFlags: async (id, flags) => {
        const scope = getTenantQueryScopeSnapshot();
        const updatedImage = await setGalleryFlags(id, flags);
        const updated = upsertById(
            queryClient.getQueryData<readonly GalleryImage[]>(queryKeys.gallery(scope.tenantKey)),
            updatedImage
        );
        queryClient.setQueryData(queryKeys.gallery(scope.tenantKey), updated);
        set({ images: [...updated] });
    },

    reset: () => set({ images: [], loading: false })
}));
