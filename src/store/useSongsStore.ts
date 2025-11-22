import { create } from 'zustand';
import { getSongTypes, getAllSongs, createSong, updateSong } from '../services/songs';
import type { Song, SongType, SongPayload } from '../types/song';

interface SongsState {
    songTypes: SongType[];
    songs: Song[];
    loading: boolean;
    
    fetchData: () => Promise<void>; // Fetches both types and songs
    addSong: (payload: SongPayload) => Promise<boolean>;
    editSong: (id: number, payload: SongPayload) => Promise<boolean>;
    
    // Helper: Get songs belonging to a specific type
    getSongsByType: (typeId: number) => Song[];
}

export const useSongsStore = create<SongsState>((set, get) => ({
    songTypes: [],
    songs: [],
    loading: false,

    fetchData: async () => {
        set({ loading: true });
        try {
            // Run in parallel
            const [types, allSongs] = await Promise.all([
                getSongTypes(),
                getAllSongs()
            ]);
            set({ songTypes: types, songs: allSongs });
        } catch (error) {
            console.error("Failed to load songs data", error);
        } finally {
            set({ loading: false });
        }
    },

    addSong: async (payload) => {
        set({ loading: true });
        try {
            const newSong = await createSong(payload);
            set((state) => ({ songs: [...state.songs, newSong] }));
            return true;
        } catch (error) {
            console.error("Failed to create song", error);
            return false;
        } finally {
            set({ loading: false });
        }
    },
    
    editSong: async (id, payload) => {
        set({ loading: true });
        try {
            const updated = await updateSong(id, payload);
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

    getSongsByType: (typeId) => {
        return get().songs.filter(s => s.songTypeId === typeId);
    }
}));