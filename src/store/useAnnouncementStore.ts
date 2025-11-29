import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getPublicAnnouncements,
    getAdminAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} from '../services/announcement';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';

interface AnnouncementState {
    announcements: Announcement[];
    loading: boolean;

    fetchPublicAnnouncements: () => Promise<void>;
    fetchAdminAnnouncements: () => Promise<void>;

    addAnnouncement: (payload: CreateAnnouncementPayload) => Promise<boolean>;
    editAnnouncement: (id: string, payload: Partial<CreateAnnouncementPayload>) => Promise<boolean>;
    removeAnnouncement: (id: string) => Promise<boolean>;
}

export const useAnnouncementStore = create<AnnouncementState>()(
    persist(
        (set, get) => ({
            announcements: [],
            loading: false,

            fetchPublicAnnouncements: async () => {
                set({ loading: true });
                try {
                    const data = await getPublicAnnouncements();
                    set({ announcements: Array.isArray(data) ? data : [] });
                } catch (e) { console.log("Offline: Cached announcements"); }
                finally { set({ loading: false }); }
            },

            fetchAdminAnnouncements: async () => {
                set({ loading: true });
                try {
                    const data = await getAdminAnnouncements();
                    set({ announcements: Array.isArray(data) ? data : [] });
                } catch (e) { console.error(e); }
                finally { set({ loading: false }); }
            },

            addAnnouncement: async (payload) => {
                set({ loading: true });
                try {
                    await createAnnouncement(payload);
                    await get().fetchAdminAnnouncements();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            editAnnouncement: async (id, payload) => {
                set({ loading: true });
                try {
                    await updateAnnouncement(id, payload);
                    await get().fetchAdminAnnouncements();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            removeAnnouncement: async (id) => {
                try {
                    await deleteAnnouncement(id);
                    set(state => ({
                        announcements: state.announcements.filter(a => a.id !== id)
                    }));
                    return true;
                } catch (e) { return false; }
            }
        }),
        {
            name: 'announcement-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);