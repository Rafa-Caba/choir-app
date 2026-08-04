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

    if (!context) {
        return [...songs];
    }

    return Promise.all(songs.map(async (song) => ({
        ...song,
        cachedAudioUrl: await cacheRemoteMedia(context, 'songs', song.audioUrl)
    })));
};

const sortSongs = (songs: readonly Song[]): Song[] => {
    return [...songs].sort((left, right) => left.title.localeCompare(right.title));
};

const sortSongTypes = (types: readonly SongType[]): SongType[] => {
    return [...types].sort((left, right) => {
        const orderDifference = left.order - right.order;
        return orderDifference !== 0
            ? orderDifference
            : left.name.localeCompare(right.name);
    });
};

const upsertSong = (songs: readonly Song[], incoming: Song): Song[] => {
    const existing = songs.find((song) => song.id === incoming.id);
    const merged = existing
        ? {
            ...existing,
            ...incoming,
            cachedAudioUrl: incoming.cachedAudioUrl ?? (
                existing.audioUrl === incoming.audioUrl
                    ? existing.cachedAudioUrl
                    : null
            )
        }
        : incoming;
    const next = existing
        ? songs.map((song) => song.id === incoming.id ? merged : song)
        : [merged, ...songs];

    return sortSongs(next);
};

const upsertSongType = (
    types: readonly SongType[],
    incoming: SongType
): SongType[] => {
    const exists = types.some((type) => type.id === incoming.id);
    const next = exists
        ? types.map((type) => type.id === incoming.id ? incoming : type)
        : [...types, incoming];

    return sortSongTypes(next);
};

export const useSongsStore = create<SongsState>((set, get) => {
    const syncData = async (showLoading: boolean): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        if (showLoading) {
            set({ loading: true });
        }

        try {
            const [songsResult, typesResult] = await Promise.all([
                syncCacheFirst<readonly Song[]>({
                    context,
                    resource: 'songs',
                    path: '/songs',
                    ttlMs: CACHE_TTL_MS.songs,
                    onData: (data) => set({ songs: sortSongs(data) })
                }),
                syncCacheFirst<readonly SongType[]>({
                    context,
                    resource: 'song-types',
                    path: '/song-types',
                    ttlMs: CACHE_TTL_MS.songTypes,
                    onData: (data) => set({ songTypes: sortSongTypes(data) })
                })
            ]);

            const rawSongs = sortSongs(songsResult.data);
            set({
                songs: rawSongs,
                songTypes: sortSongTypes(typesResult.data)
            });

            hydrateSongs(rawSongs)
                .then((hydrated) => set((state) => ({
                    songs: hydrated.reduce<Song[]>(
                        (current, song) => upsertSong(current, song),
                        state.songs
                    )
                })))
                .catch(() => undefined);
        } finally {
            if (showLoading) {
                set({ loading: false });
            }
        }
    };

    const refreshInBackground = (): void => {
        syncData(false).catch(() => undefined);
    };

    const hydrateSongInBackground = (song: Song): void => {
        hydrateSongs([song])
            .then(([hydrated]) => set((state) => ({
                songs: upsertSong(state.songs, hydrated)
            })))
            .catch(() => undefined);
    };

    return {
        songs: [],
        songTypes: [],
        loading: false,

        fetchData: () => syncData(true),

        addSong: async (payload, audioUri) => {
            set({ loading: true });

            try {
                const created = await createSong(payload, audioUri);
                set((state) => ({ songs: upsertSong(state.songs, created) }));
                hydrateSongInBackground(created);
                refreshInBackground();
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
                const updated = await updateSong(id, payload, audioUri);
                set((state) => ({ songs: upsertSong(state.songs, updated) }));
                hydrateSongInBackground(updated);
                refreshInBackground();
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
                set((state) => ({
                    songs: state.songs.filter((song) => song.id !== id)
                }));
                refreshInBackground();
                return true;
            } catch {
                return false;
            }
        },

        getSongsByType: (typeId) => {
            if (!typeId) {
                return get().songs;
            }

            return get().songs.filter((song) => song.songTypeId === typeId);
        },

        addType: async (name, order, parentId, isParent) => {
            set({ loading: true });

            try {
                const created = await createSongType(
                    name,
                    order,
                    parentId ?? undefined,
                    isParent
                );
                set((state) => ({
                    songTypes: upsertSongType(state.songTypes, created)
                }));
                refreshInBackground();
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
                const updated = await updateSongType(id, name, order, isParent);
                set((state) => ({
                    songTypes: upsertSongType(state.songTypes, updated)
                }));
                refreshInBackground();
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
                set((state) => ({
                    songTypes: state.songTypes.filter((type) => type.id !== id)
                }));
                refreshInBackground();
                return true;
            } catch {
                return false;
            }
        },

        reset: () => set({ songs: [], songTypes: [], loading: false })
    };
});
