import { create } from 'zustand';
import { deleteGalleryImage, getAllImages, uploadImage } from '../services/gallery';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';

interface GalleryState {
    images: GalleryImage[];
    loading: boolean;
    
    fetchImages: () => Promise<void>;
    addImage: (payload: CreateGalleryPayload) => Promise<boolean>;
    removeImage: (id: number) => Promise<boolean>;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
    images: [],
    loading: false,

    fetchImages: async () => {
        set({ loading: true });
        try {
            const data = await getAllImages();
            set({ images: data });
        } catch (error) {
            console.error("Failed to load gallery", error);
        } finally {
            set({ loading: false });
        }
    },

    addImage: async (payload) => {
        set({ loading: true });
        try {
            const newImage = await uploadImage(payload);
            // Add to the beginning of the list
            set((state) => ({ images: [newImage, ...state.images] }));
            return true;
        } catch (error) {
            console.error("Failed to upload image", error);
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeImage: async (id) => {
        try {
            await deleteGalleryImage(id);
            set((state) => ({
                images: state.images.filter((img) => img.id !== id)
            }));
            return true;
        } catch (error) {
            console.error("Failed to delete image", error);
            return false;
        }
    }
}));