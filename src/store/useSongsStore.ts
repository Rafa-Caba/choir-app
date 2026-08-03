// src/store/useSongsStore.ts

import { create } from 'zustand';
import {
    createSong,
    createSongType,
    deleteSong,
    deleteSongType,
    updateSong,
    updateSongType
} from '../services/song';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type { CreateSongPayload, Song, SongType } from '../types/song';
import { useAuthStore } from './useAuthStore';

interface SongsState {
    songs: Song[];
    songTypes: SongType[];
    loading: boolean;
    fetchData: () => Promise<void>;
    addSong: (payload: CreateSongPayload, audioUri?: string) => Promise<boolean>;
    editSong: (id: string, payload: Partial<CreateSongPayload>, audioUri?: string) => Promise<boolean>;
    removeSong: (id: string) => Promise<boolean>;
    getSongsByType: (typeId: string) => Song[];
    addType: (name: string, order: number, parentId?: string | null, isParent?: boolean) => Promise<boolean>;
    editType: (id: string, name: string, order: number, isParent?: boolean) => Promise<boolean>;
    removeType: (id: string) => Promise<boolean>;
    reset: () => void;
}

const hydrateSongs = async (songs: readonly Song[]): Promise<Song[]> => {
    const context = useAuthStore.getState().getTenantContext();
    if (!context) return [...songs];

    return Promise.all(songs.map(async (song) => ({
        ...song,
        cachedAudioUrl: await cacheRemoteMedia(context, 'songs', song.audioUrl)
    })));
};

export const useSongsStore = create<SongsState>((set, get) => ({
    songs: [],
    songTypes: [],
    loading: false,

    fetchData: async () => {
        const context = useAuthStore.getState().getTenantContext();
        if (!context) return;
        set({ loading: true });

        try {
            const [songsResult, typesResult] = await Promise.all([
                syncCacheFirst<readonly Song[]>({
                    context,
                    resource: 'songs',
                    path: '/songs',
                    ttlMs: CACHE_TTL_MS.songs,
                    onData: (data) => set({ songs: [...data] })
                }),
                syncCacheFirst<readonly SongType[]>({
                    context,
                    resource: 'song-types',
                    path: '/song-types',
                    ttlMs: CACHE_TTL_MS.songTypes,
                    onData: (data) => set({ songTypes: [...data] })
                })
            ]);
            set({
                songs: await hydrateSongs(songsResult.data),
                songTypes: [...typesResult.data]
            });
        } finally {
            set({ loading: false });
        }
    },

    addSong: async (payload, audioUri) => {
        set({ loading: true });
        try {
            await createSong(payload, audioUri);
            await get().fetchData();
            return true;
        } catch {
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
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeSong: async (id) => {
        try {
            await deleteSong(id);
            await get().fetchData();
            return true;
        } catch {
            return false;
        }
    },

    getSongsByType: (typeId) => {
        if (!typeId) return get().songs;
        return get().songs.filter((song) => song.songTypeId === typeId);
    },

    addType: async (name, order, parentId, isParent) => {
        set({ loading: true });
        try {
            await createSongType(name, order, parentId ?? undefined, isParent);
            await get().fetchData();
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    editType: async (id, name, order, isParent) => {
        set({ loading: true });
        try {
            await updateSongType(id, name, order, isParent);
            await get().fetchData();
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeType: async (id) => {
        try {
            await deleteSongType(id);
            await get().fetchData();
            return true;
        } catch {
            return false;
        }
    },

    reset: () => set({ songs: [], songTypes: [], loading: false })
}));
