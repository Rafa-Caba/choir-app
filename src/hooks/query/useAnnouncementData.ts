// src/hooks/query/useAnnouncementData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    updateAnnouncement
} from '../../services/announcement';
import type { Announcement, CreateAnnouncementPayload } from '../../types/announcement';
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useTenantQueryScope } from './useTenantQueryScope';

interface UpdateAnnouncementVariables {
    readonly id: string;
    readonly payload: Partial<CreateAnnouncementPayload>;
}

export const useAnnouncementsQuery = (visibility: 'all' | 'public') => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.announcements(scope.tenantKey),
        queryFn: getAnnouncements,
        enabled: scope.enabled,
        select: (items) => visibility === 'public'
            ? items.filter((item) => item.isPublic)
            : items
    });
};

const updateAnnouncementCache = (
    queryClient: ReturnType<typeof useQueryClient>,
    tenantKey: string,
    incoming: Announcement
): void => {
    queryClient.setQueryData<readonly Announcement[]>(
        queryKeys.announcements(tenantKey),
        (current) => upsertById(current, incoming)
    );
};

export const useCreateAnnouncementMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: createAnnouncement,
        onSuccess: (created) => updateAnnouncementCache(queryClient, scope.tenantKey, created)
    });
};

export const useUpdateAnnouncementMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, payload }: UpdateAnnouncementVariables) => updateAnnouncement(id, payload),
        onSuccess: (updated) => updateAnnouncementCache(queryClient, scope.tenantKey, updated)
    });
};

export const useDeleteAnnouncementMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: deleteAnnouncement,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly Announcement[]>(
                queryKeys.announcements(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};
