import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    getSongTypes, getAllSongs, createSong, updateSong, deleteSong,
    createSongType, updateSongType, deleteSongType 
} from '../services/songs';
import type { Song, SongType, SongPayload } from '../types/song';

interface SongsState {
    songTypes: SongType[];
    songs: Song[];
    loading: boolean;
    fetchData: () => Promise<void>;
    
    // Songs
    addSong: (payload: SongPayload, audioUri?: string) => Promise<boolean>;
    editSong: (id: number, payload: SongPayload, audioUri?: string) => Promise<boolean>;
    removeSong: (id: number) => Promise<boolean>;

    // Types
    addType: (name: string, order: number) => Promise<boolean>;
    editType: (id: number, name: string, order: number) => Promise<boolean>;
    removeType: (id: number) => Promise<boolean>;
    
    getSongsByType: (typeId: number) => Song[];
}

export const useSongsStore = create<SongsState>()(
    persist(
        (set, get) => ({
            songTypes: [],
            songs: [],
            loading: false,

            fetchData: async () => {
                set({ loading: true });
                try {
                    const [types, allSongs] = await Promise.all([
                        getSongTypes(),
                        getAllSongs()
                    ]);
                    set({ songTypes: types, songs: allSongs });
                } catch (error) {
                    console.error("Offline mode: Using cached data");
                } finally {
                    set({ loading: false });
                }
            },

            // --- Songs ---
            addSong: async (payload, audioUri) => {
                set({ loading: true });
                try {
                    const newSong = await createSong(payload, audioUri);
                    set((state) => ({ songs: [...state.songs, newSong] }));
                    return true;
                } catch (error) {
                    console.error("Failed to create song", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },
            
            editSong: async (id, payload, audioUri) => {
                set({ loading: true });
                try {
                    const updated = await updateSong(id, payload, audioUri);
                    set((state) => ({
                        songs: state.songs.map(s => s.id === id ? updated : s)
                    }));
                    return true;
                } catch (error) {
                    console.error("Failed to update song", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            removeSong: async (id) => {
                set({ loading: true });
                try {
                    await deleteSong(id);
                    set((state) => ({
                        songs: state.songs.filter(s => s.id !== id)
                    }));
                    return true;
                } catch (error) {
                    console.error("Failed to delete song", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            // --- Types ---
            addType: async (name, order) => {
                try {
                    const newType = await createSongType(name, order);
                    set((state) => ({ 
                        songTypes: [...state.songTypes, newType].sort((a,b) => a.order - b.order) 
                    }));
                    return true;
                } catch (e) { return false; }
            },

            editType: async (id, name, order) => {
                try {
                    const updated = await updateSongType(id, name, order);
                    set((state) => ({
                        songTypes: state.songTypes.map(t => t.id === id ? updated : t).sort((a,b) => a.order - b.order)
                    }));
                    return true;
                } catch (e) { return false; }
            },

            removeType: async (id) => {
                try {
                    await deleteSongType(id);
                    set((state) => ({
                        songTypes: state.songTypes.filter(t => t.id !== id)
                    }));
                    return true;
                } catch (e) { return false; }
            },

            getSongsByType: (typeId) => {
                return get().songs.filter(s => s.songTypeId === typeId);
            }
        }),
        {
            name: 'songs-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);