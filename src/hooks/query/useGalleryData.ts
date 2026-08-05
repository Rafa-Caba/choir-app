// src/hooks/query/useGalleryData.ts

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
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useTenantQueryScope } from './useTenantQueryScope';

interface SetGalleryFlagsVariables {
    readonly id: string;
    readonly flags: GalleryFlags;
}

export const useGalleryQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.gallery(scope.tenantKey),
        queryFn: getAllImages,
        enabled: scope.enabled
    });
};

export const useAddGalleryImageMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (payload: CreateGalleryPayload) => addImage(payload),
        onSuccess: (created) => {
            queryClient.setQueryData<readonly GalleryImage[]>(
                queryKeys.gallery(scope.tenantKey),
                (current) => upsertById(current, created)
            );
        }
    });
};

export const useDeleteGalleryImageMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: removeImage,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly GalleryImage[]>(
                queryKeys.gallery(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};

export const useSetGalleryFlagsMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, flags }: SetGalleryFlagsVariables) => setGalleryFlags(id, flags),
        onSuccess: (updated) => {
            queryClient.setQueryData<readonly GalleryImage[]>(
                queryKeys.gallery(scope.tenantKey),
                (current) => upsertById(current, updated)
            );
        }
    });
};
