// src/store/useAnnouncementStore.ts

import { create } from 'zustand';
import {
    createAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    updateAnnouncement
} from '../services/announcement';
import { getApiErrorMessage } from '../services/auth';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { removeById, upsertById } from '../query/cacheUpdates';

interface AnnouncementState {
    readonly announcements: readonly Announcement[];
    readonly loading: boolean;
    readonly errorMessage: string | null;
    fetchPublicAnnouncements: () => Promise<void>;
    fetchAdminAnnouncements: () => Promise<void>;
    addAnnouncement: (payload: CreateAnnouncementPayload) => Promise<boolean>;
    editAnnouncement: (id: string, payload: Partial<CreateAnnouncementPayload>) => Promise<boolean>;
    removeAnnouncement: (id: string) => Promise<boolean>;
    reset: () => void;
}

const writeCachedAnnouncements = (
    updater: (current: readonly Announcement[]) => readonly Announcement[]
): readonly Announcement[] => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return [];
    }

    const key = queryKeys.announcements(scope.tenantKey);
    queryClient.setQueryData<readonly Announcement[]>(key, (current) => updater(current ?? []));
    return queryClient.getQueryData<readonly Announcement[]>(key) ?? [];
};

export const useAnnouncementStore = create<AnnouncementState>((set) => {
    const fetchAnnouncements = async (): Promise<void> => {
        const scope = getTenantQueryScopeSnapshot();

        if (!scope.enabled) {
            set({ announcements: [] });
            return;
        }

        set({ loading: true, errorMessage: null });

        try {
            const announcements = await queryClient.fetchQuery({
                queryKey: queryKeys.announcements(scope.tenantKey),
                queryFn: getAnnouncements,
                staleTime: 15_000
            });
            set({ announcements });
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            throw error;
        } finally {
            set({ loading: false });
        }
    };

    return {
        announcements: [],
        loading: false,
        errorMessage: null,
        fetchPublicAnnouncements: fetchAnnouncements,
        fetchAdminAnnouncements: fetchAnnouncements,

        addAnnouncement: async (payload) => {
            set({ loading: true, errorMessage: null });

            try {
                const created = await createAnnouncement(payload);
                const announcements = writeCachedAnnouncements(
                    (current) => upsertById(current, created)
                );
                set({ announcements });
                return true;
            } catch (error) {
                set({ errorMessage: getApiErrorMessage(error as object) });
                return false;
            } finally {
                set({ loading: false });
            }
        },

        editAnnouncement: async (id, payload) => {
            set({ loading: true, errorMessage: null });

            try {
                const updated = await updateAnnouncement(id, payload);
                const announcements = writeCachedAnnouncements(
                    (current) => upsertById(current, updated)
                );
                set({ announcements });
                return true;
            } catch (error) {
                set({ errorMessage: getApiErrorMessage(error as object) });
                return false;
            } finally {
                set({ loading: false });
            }
        },

        removeAnnouncement: async (id) => {
            try {
                await deleteAnnouncement(id);
                const announcements = writeCachedAnnouncements(
                    (current) => removeById(current, id)
                );
                set({ announcements });
                return true;
            } catch (error) {
                set({ errorMessage: getApiErrorMessage(error as object) });
                return false;
            }
        },

        reset: () => set({
            announcements: [],
            loading: false,
            errorMessage: null
        })
    };
});
