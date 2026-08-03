// src/store/useAnnouncementStore.ts

import { create } from 'zustand';
import {
    createAnnouncement,
    deleteAnnouncement,
    updateAnnouncement
} from '../services/announcement';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';
import { useAuthStore } from './useAuthStore';

interface AnnouncementState {
    announcements: Announcement[];
    loading: boolean;
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

export const useAnnouncementStore = create<AnnouncementState>((set, get) => {
    const fetchAnnouncements = async (): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        set({ loading: true });

        try {
            const result = await syncCacheFirst<readonly Announcement[]>({
                context,
                resource: 'announcements',
                path: '/announcements',
                ttlMs: CACHE_TTL_MS.announcements,
                onData: (data) => set({ announcements: [...data] })
            });
            set({ announcements: await hydrateAnnouncements(result.data) });
        } finally {
            set({ loading: false });
        }
    };

    return {
        announcements: [],
        loading: false,
        fetchPublicAnnouncements: fetchAnnouncements,
        fetchAdminAnnouncements: fetchAnnouncements,
        addAnnouncement: async (payload) => {
            set({ loading: true });
            try {
                await createAnnouncement(payload);
                await fetchAnnouncements();
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        editAnnouncement: async (id, payload) => {
            set({ loading: true });
            try {
                await updateAnnouncement(id, payload);
                await fetchAnnouncements();
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        removeAnnouncement: async (id) => {
            try {
                await deleteAnnouncement(id);
                await fetchAnnouncements();
                return true;
            } catch {
                return false;
            }
        },
        reset: () => set({ announcements: [], loading: false })
    };
});
