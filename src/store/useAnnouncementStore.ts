import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    getPublicAnnouncements, 
    getAdminAnnouncements,
    createAnnouncement, 
    updateAnnouncement,
    deleteAnnouncement, 
    AnnouncementPayload 
} from '../services/announcements';
import type { Announcement } from '../types/announcement';

interface AnnouncementState {
    announcements: Announcement[];
    loading: boolean;
    
    fetchPublicAnnouncements: () => Promise<void>;
    fetchAdminAnnouncements: () => Promise<void>;
    
    addAnnouncement: (payload: AnnouncementPayload) => Promise<boolean>;
    editAnnouncement: (id: number, payload: AnnouncementPayload) => Promise<boolean>;
    removeAnnouncement: (id: number) => Promise<void>;
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
                    set({ announcements: data });
                } catch (error) {
                    console.log("Offline: Using cached announcements");
                } finally {
                    set({ loading: false });
                }
            },

            fetchAdminAnnouncements: async () => {
                set({ loading: true });
                try {
                    const data = await getAdminAnnouncements();
                    set({ announcements: data });
                } catch (error) {
                    console.log("Offline: Using cached admin announcements");
                } finally {
                    set({ loading: false });
                }
            },

            addAnnouncement: async (payload) => {
                set({ loading: true });
                try {
                    // We used destructured params in the service fix
                    await createAnnouncement(
                        payload.title, 
                        payload.content, 
                        payload.isPublic, 
                        payload.imageUri
                    );
                    await get().fetchAdminAnnouncements(); 
                    return true;
                } catch (error) {
                    console.error("Failed to create announcement", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            editAnnouncement: async (id, payload) => {
                set({ loading: true });
                try {
                    await updateAnnouncement(
                        id,
                        payload.title, 
                        payload.content, 
                        payload.isPublic, 
                        payload.imageUri
                    ); 
                    await get().fetchAdminAnnouncements();
                    return true;
                } catch (error) {
                    console.error("Failed to update announcement", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            removeAnnouncement: async (id) => {
                try {
                    await deleteAnnouncement(id);
                    set((state) => ({
                        announcements: state.announcements.filter(a => a.id !== id)
                    }));
                } catch (error) {
                    console.error("Failed to delete announcement", error);
                }
            }
        }),
        {
            name: 'announcement-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);