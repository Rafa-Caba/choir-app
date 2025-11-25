import { create } from 'zustand';
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

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
    announcements: [],
    loading: false,

    fetchPublicAnnouncements: async () => {
        set({ loading: true });
        try {
            const data = await getPublicAnnouncements();
            set({ announcements: data });
        } catch (error) {
            console.error("Failed to fetch public announcements", error);
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
            console.error("Failed to fetch admin announcements", error);
        } finally {
            set({ loading: false });
        }
    },

    addAnnouncement: async (payload) => {
        set({ loading: true });
        try {
            // FIX: Destructure payload to pass arguments separately
            await createAnnouncement(
                payload.title, 
                payload.content, 
                payload.isPublic, 
                payload.imageUri
            );
            
            // If we are admin, fetch admin list.
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
            // FIX: Destructure payload to pass arguments separately
            await updateAnnouncement(
                id,
                payload.title, 
                payload.content, 
                payload.isPublic, 
                payload.imageUri
            );

            // Always fetch admin list after edit
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
}));