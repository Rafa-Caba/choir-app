// src/store/useAnnouncementStore.ts

import { create } from 'zustand';
import {
    createAnnouncement,
    deleteAnnouncement,
    updateAnnouncement
} from '../services/announcement';
import { getApiErrorMessage } from '../services/auth';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';
import { useAuthStore } from './useAuthStore';

interface AnnouncementState {
    announcements: Announcement[];
    loading: boolean;
    errorMessage: string | null;
    fetchPublicAnnouncements: () => Promise<void>;
    fetchAdminAnnouncements: () => Promise<void>;
    addAnnouncement: (payload: CreateAnnouncementPayload) => Promise<boolean>;
    editAnnouncement: (id: string, payload: Partial<CreateAnnouncementPayload>) => Promise<boolean>;
    removeAnnouncement: (id: string) => Promise<boolean>;
    reset: () => void;
}

const hydrateAnnouncements = async (
    announcements: readonly Announcement[]
): Promise<Announcement[]> => {
    const context = useAuthStore.getState().getTenantContext();

    if (!context) {
        return [...announcements];
    }

    return Promise.all(announcements.map(async (announcement) => ({
        ...announcement,
        cachedImageUrl: await cacheRemoteMedia(context, 'announcements', announcement.imageUrl)
    })));
};

const replaceAnnouncement = (
    announcements: readonly Announcement[],
    incoming: Announcement
): Announcement[] => {
    const exists = announcements.some((announcement) => announcement.id === incoming.id);
    return exists
        ? announcements.map((announcement) => announcement.id === incoming.id ? incoming : announcement)
        : [incoming, ...announcements];
};

export const useAnnouncementStore = create<AnnouncementState>((set, get) => {
    const fetchAnnouncements = async (): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        set({ loading: true, errorMessage: null });

        try {
            const result = await syncCacheFirst<readonly Announcement[]>({
                context,
                resource: 'announcements',
                path: '/announcements',
                ttlMs: CACHE_TTL_MS.announcements,
                onData: (data) => set({ announcements: [...data] })
            });
            set({ announcements: await hydrateAnnouncements(result.data) });
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
                const [hydrated] = await hydrateAnnouncements([created]);
                set((state) => ({
                    announcements: replaceAnnouncement(state.announcements, hydrated)
                }));
                get().fetchPublicAnnouncements().catch(() => undefined);
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
                const [hydrated] = await hydrateAnnouncements([updated]);
                set((state) => ({
                    announcements: replaceAnnouncement(state.announcements, hydrated)
                }));
                get().fetchPublicAnnouncements().catch(() => undefined);
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
                set((state) => ({
                    announcements: state.announcements.filter((announcement) => announcement.id !== id)
                }));
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
