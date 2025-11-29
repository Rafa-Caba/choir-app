import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllImages, addImage, removeImage, setFlags } from '../services/gallery';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';

interface GalleryState {
    images: GalleryImage[];
    loading: boolean;

    fetchImages: () => Promise<void>;
    addImage: (payload: CreateGalleryPayload) => Promise<boolean>;
    removeImage: (id: string) => Promise<boolean>;
    setFlags: (id: string, flags: any) => Promise<void>;
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
                    set({ images: Array.isArray(data) ? data : [] });
                } catch (error) {
                    console.log("Offline: Using cached gallery");
                } finally {
                    set({ loading: false });
                }
            },

            addImage: async (payload) => {
                set({ loading: true });
                try {
                    const success = await addImage(payload);
                    if (success) await get().fetchImages();
                    return success;
                } catch (error) { return false; }
                finally { set({ loading: false }); }
            },

            removeImage: async (id) => {
                try {
                    await removeImage(id);
                    set((state) => ({
                        images: state.images.filter((img) => img.id !== id)
                    }));
                    return true;
                } catch (error) { return false; }
            },

            setFlags: async (id, flags) => {
                try {
                    // Optimistic Update
                    set(state => {
                        const newImages = state.images.map(img => {
                            const isTarget = img.id === id;
                            let updates = { ...img };

                            // If setting a flag true (exclusive flags), turn off others
                            const exclusiveKeys = ['imageLogo', 'imageStart', 'imageTopBar', 'imageUs'];

                            exclusiveKeys.forEach(key => {
                                // 🛠️ FIX: Cast to 'any' to allow dynamic boolean assignment
                                if (flags[key] && !isTarget) {
                                    (updates as any)[key] = false;
                                }
                            });

                            if (isTarget) return { ...updates, ...flags };
                            return updates;
                        });
                        return { images: newImages };
                    });

                    await setFlags(id, flags);
                } catch (e) { console.error("Flag update failed", e); }
            }
        }),
        {
            name: 'gallery-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);