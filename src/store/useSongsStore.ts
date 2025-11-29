import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAllSongs, createSong, updateSong, deleteSong,
    getSongTypes, createSongType, updateSongType, deleteSongType
} from '../services/song';
import type { Song, SongType, CreateSongPayload } from '../types/song';

interface SongsState {
    songs: Song[];
    songTypes: SongType[];
    loading: boolean;

    fetchData: () => Promise<void>;

    // Songs
    addSong: (payload: CreateSongPayload, audioUri?: string) => Promise<boolean>;
    editSong: (id: string, payload: Partial<CreateSongPayload>, audioUri?: string) => Promise<boolean>;
    removeSong: (id: string) => Promise<boolean>;
    getSongsByType: (typeId: string) => Song[];

    // 🆕 Song Types (Categories)
    addType: (name: string, order: number, parentId?: string | null, isParent?: boolean) => Promise<boolean>;
    editType: (id: string, name: string, order: number, isParent?: boolean) => Promise<boolean>;
    removeType: (id: string) => Promise<boolean>;
}

export const useSongsStore = create<SongsState>()(
    persist(
        (set, get) => ({
            songs: [],
            songTypes: [],
            loading: false,

            fetchData: async () => {
                set({ loading: true });
                try {
                    const [songsData, typesData] = await Promise.all([
                        getAllSongs(),
                        getSongTypes()
                    ]);

                    set({
                        songs: Array.isArray(songsData) ? songsData : [],
                        songTypes: Array.isArray(typesData) ? typesData : []
                    });
                } catch (e) {
                    console.log("Offline: Using cached songs");
                } finally {
                    set({ loading: false });
                }
            },

            // --- Songs ---
            addSong: async (payload, audioUri) => {
                set({ loading: true });
                try {
                    await createSong(payload, audioUri);
                    await get().fetchData();
                    return true;
                } catch (e) {
                    console.error("Create Song Failed:", e);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            editSong: async (id, payload, audioUri) => {
                set({ loading: true });
                try {
                    await updateSong(id, payload, audioUri);
                    await get().fetchData();
                    return true;
                } catch (e) {
                    console.error("Update Song Failed:", e);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            removeSong: async (id) => {
                try {
                    await deleteSong(id);
                    set(state => ({ songs: state.songs.filter(s => s.id !== id) }));
                    return true;
                } catch (e) { return false; }
            },

            getSongsByType: (typeId) => {
                const { songs } = get();
                if (!typeId) return songs;
                return songs.filter(s => s.songTypeId === typeId);
            },

            // --- 🆕 Song Types ---
            addType: async (name, order, parentId, isParent) => {
                set({ loading: true });
                try {
                    await createSongType(name, order, parentId || undefined, isParent);
                    await get().fetchData();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            editType: async (id, name, order, isParent) => {
                set({ loading: true });
                try {
                    await updateSongType(id, name, order, isParent);
                    await get().fetchData();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            removeType: async (id) => {
                try {
                    await deleteSongType(id);
                    await get().fetchData(); // Refresh to ensure hierarchy is clean
                    return true;
                } catch (e) { return false; }
            }
        }),
        {
            name: 'songs-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);