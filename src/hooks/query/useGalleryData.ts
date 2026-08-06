// src/hooks/query/useGalleryData.ts

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addImage,
    getAllImages,
    removeImage,
    setGalleryFlags
} from '../../services/gallery';
import type {
    CreateGalleryPayload,
    GalleryFlags,
    GalleryImage
} from '../../types/gallery';
import type { TenantStorageContext } from '../../types/sync';
import { CACHE_TTL_MS } from '../../config/cachePolicy';
import {
    hydrateGalleryLocalMedia,
    loadGallerySnapshot,
    saveGallerySnapshot,
    warmGalleryPreviewCache
} from '../../storage/galleryMediaCache';
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useTenantQueryScope } from './useTenantQueryScope';

interface SetGalleryFlagsVariables {
    readonly id: string;
    readonly flags: GalleryFlags;
}

const persistGalleryData = async (
    context: TenantStorageContext | null,
    images: readonly GalleryImage[]
): Promise<void> => {
    if (!context) {
        return;
    }

    await saveGallerySnapshot(context, images);
};

export const useGalleryQuery = () => {
    const scope = useTenantQueryScope();
    const queryClient = useQueryClient();
    const queryKey = queryKeys.gallery(scope.tenantKey);
    const [snapshot, setSnapshot] = useState<readonly GalleryImage[] | null>(null);
    const [snapshotReady, setSnapshotReady] = useState(false);

    useEffect(() => {
        let active = true;

        setSnapshot(null);
        setSnapshotReady(false);

        const hydrateSnapshot = async (): Promise<void> => {
            if (!scope.context) {
                if (active) {
                    setSnapshot([]);
                    setSnapshotReady(true);
                }
                return;
            }

            const cached = await loadGallerySnapshot(scope.context);

            if (!active) {
                return;
            }

            setSnapshot(cached);
            setSnapshotReady(true);

            if (cached.length > 0) {
                void warmGalleryPreviewCache(scope.context, cached)
                    .then((warmed) => {
                        if (!active) {
                            return;
                        }

                        setSnapshot(warmed);
                        queryClient.setQueryData<readonly GalleryImage[]>(
                            queryKey,
                            (current) => current ? hydrateGalleryMerge(current, warmed) : warmed
                        );
                    })
                    .catch(() => undefined);
            }
        };

        void hydrateSnapshot();

        return () => {
            active = false;
        };
    }, [queryClient, scope.tenantKey]);

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<readonly GalleryImage[]> => {
            if (!scope.context) {
                return [];
            }

            try {
                const networkImages = await getAllImages();
                const hydrated = await hydrateGalleryLocalMedia(
                    scope.context,
                    networkImages
                );
                await saveGallerySnapshot(scope.context, hydrated);

                void warmGalleryPreviewCache(scope.context, hydrated)
                    .then((warmed) => {
                        queryClient.setQueryData(queryKey, warmed);
                    })
                    .catch(() => undefined);

                return hydrated;
            } catch (error) {
                const cached = await loadGallerySnapshot(scope.context);

                if (cached.length > 0) {
                    return cached;
                }

                throw error;
            }
        },
        enabled: scope.enabled && snapshotReady,
        staleTime: CACHE_TTL_MS.gallery
    });

    return {
        ...query,
        data: query.data ?? snapshot ?? [],
        isLoading: !snapshotReady && snapshot === null
    };
};

const hydrateGalleryMerge = (
    current: readonly GalleryImage[],
    warmed: readonly GalleryImage[]
): readonly GalleryImage[] => {
    const warmedById = new Map(warmed.map((image) => [image.id, image]));

    return current.map((image) => {
        const warmedImage = warmedById.get(image.id);

        return warmedImage
            ? {
                ...image,
                cachedImageUrl: warmedImage.cachedImageUrl,
                cachedThumbnailUrl: warmedImage.cachedThumbnailUrl,
                cachedPreviewUrl: warmedImage.cachedPreviewUrl
            }
            : image;
    });
};

export const useAddGalleryImageMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (payload: CreateGalleryPayload) => addImage(payload),
        onSuccess: (created) => {
            const updated = upsertById(
                queryClient.getQueryData<readonly GalleryImage[]>(
                    queryKeys.gallery(scope.tenantKey)
                ),
                created
            );
            queryClient.setQueryData(
                queryKeys.gallery(scope.tenantKey),
                updated
            );
            void persistGalleryData(scope.context, updated);
        }
    });
};

export const useDeleteGalleryImageMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: removeImage,
        onSuccess: (_data, id) => {
            const updated = removeById(
                queryClient.getQueryData<readonly GalleryImage[]>(
                    queryKeys.gallery(scope.tenantKey)
                ),
                id
            );
            queryClient.setQueryData(
                queryKeys.gallery(scope.tenantKey),
                updated
            );
            void persistGalleryData(scope.context, updated);
        }
    });
};

export const useSetGalleryFlagsMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, flags }: SetGalleryFlagsVariables) => setGalleryFlags(id, flags),
        onSuccess: (updatedImage) => {
            const updated = upsertById(
                queryClient.getQueryData<readonly GalleryImage[]>(
                    queryKeys.gallery(scope.tenantKey)
                ),
                updatedImage
            );
            queryClient.setQueryData(
                queryKeys.gallery(scope.tenantKey),
                updated
            );
            void persistGalleryData(scope.context, updated);
        }
    });
};
