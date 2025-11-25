import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteGalleryImage, getAllImages, uploadImage, updateImageFlags } from '../services/gallery';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';

interface GalleryState {
    images: GalleryImage[];
    loading: boolean;
    
    fetchImages: () => Promise<void>;
    addImage: (payload: CreateGalleryPayload) => Promise<boolean>;
    removeImage: (id: number) => Promise<boolean>;
    setFlags: (id: number, flags: any) => Promise<void>;
}

export const useGalleryStore = create<GalleryState>()(
    persist(
        (set, get) => ({
            images: [],
            loading: false,

            fetchImages: async () => {
                set({ loading: true });
                try {
                    const data = await getAllImages();
                    set({ images: data });
                } catch (error) {
                    console.log("Offline: Using cached gallery");
                } finally {
                    set({ loading: false });
                }
            },

            addImage: async (payload) => {
                set({ loading: true });
                try {
                    const newImage = await uploadImage(payload);
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
            },

            setFlags: async (id, flags) => {
                try {
                    // Optimistic Update
                    set(state => {
                        const newImages = state.images.map(img => {
                            const isTarget = img.id === id;
                            let updates = { ...img };

                            // Enforce mutual exclusivity logic locally
                            if (flags.imageLogo && !isTarget) updates.imageLogo = false;
                            if (flags.imageStart && !isTarget) updates.imageStart = false;
                            if (flags.imageTopBar && !isTarget) updates.imageTopBar = false;
                            if (flags.imageUs && !isTarget) updates.imageUs = false;

                            if (isTarget) {
                                return { ...updates, ...flags };
                            }
                            return updates;
                        });
                        return { images: newImages };
                    });

                    await updateImageFlags(id, flags);
                    // We don't necessarily need to re-fetch here if optimistic update works well
                } catch (e) {
                    console.error("Failed to update flags", e);
                    // In a real app, you might want to rollback state here
                }
            }
        }),
        {
            name: 'gallery-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);