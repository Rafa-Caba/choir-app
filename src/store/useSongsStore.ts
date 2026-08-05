// src/store/useSongsStore.ts

import { create } from 'zustand';
import {
    createSong,
    createSongType,
    deleteSong,
    deleteSongType,
    getAllSongs,
    getSongTypes,
    updateSong,
    updateSongType
} from '../services/song';
import type { CreateSongPayload, Song, SongType } from '../types/song';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { removeById, upsertById } from '../query/cacheUpdates';

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

const sortSongs = (songs: readonly Song[]): Song[] =>
    [...songs].sort((left, right) => left.title.localeCompare(right.title));

const sortSongTypes = (types: readonly SongType[]): SongType[] =>
    [...types].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));

export const useSongsStore = create<SongsState>((set, get) => {
    const publishSongs = (songs: readonly Song[]): void => set({ songs: sortSongs(songs) });
    const publishTypes = (types: readonly SongType[]): void => set({ songTypes: sortSongTypes(types) });

    return {
        songs: [],
        songTypes: [],
        loading: false,

        fetchData: async () => {
            const scope = getTenantQueryScopeSnapshot();

            if (!scope.enabled) {
                return;
            }

            set({ loading: true });
            try {
                const [songs, types] = await Promise.all([
                    queryClient.fetchQuery({
                        queryKey: queryKeys.songs(scope.tenantKey),
                        queryFn: getAllSongs,
                        staleTime: 30_000
                    }),
                    queryClient.fetchQuery({
                        queryKey: queryKeys.songTypes(scope.tenantKey),
                        queryFn: getSongTypes,
                        staleTime: 5 * 60_000
                    })
                ]);
                publishSongs(songs);
                publishTypes(types);
            } finally {
                set({ loading: false });
            }
        },

        addSong: async (payload, audioUri) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });
            try {
                const created = await createSong(payload, audioUri);
                const updated = sortSongs(upsertById(
                    queryClient.getQueryData<readonly Song[]>(queryKeys.songs(scope.tenantKey)),
                    created
                ));
                queryClient.setQueryData(queryKeys.songs(scope.tenantKey), updated);
                publishSongs(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },

        editSong: async (id, payload, audioUri) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });
            try {
                const updatedSong = await updateSong(id, payload, audioUri);
                const updated = sortSongs(upsertById(
                    queryClient.getQueryData<readonly Song[]>(queryKeys.songs(scope.tenantKey)),
                    updatedSong
                ));
                queryClient.setQueryData(queryKeys.songs(scope.tenantKey), updated);
                publishSongs(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },

        removeSong: async (id) => {
            const scope = getTenantQueryScopeSnapshot();
            try {
                await deleteSong(id);
                const updated = sortSongs(removeById(
                    queryClient.getQueryData<readonly Song[]>(queryKeys.songs(scope.tenantKey)),
                    id
                ));
                queryClient.setQueryData(queryKeys.songs(scope.tenantKey), updated);
                publishSongs(updated);
                return true;
            } catch {
                return false;
            }
        },

        getSongsByType: (typeId) => typeId
            ? get().songs.filter((song) => song.songTypeId === typeId)
            : get().songs,

        addType: async (name, order, parentId, isParent) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });
            try {
                const created = await createSongType(name, order, parentId ?? undefined, isParent);
                const updated = sortSongTypes(upsertById(
                    queryClient.getQueryData<readonly SongType[]>(queryKeys.songTypes(scope.tenantKey)),
                    created,
                    'end'
                ));
                queryClient.setQueryData(queryKeys.songTypes(scope.tenantKey), updated);
                publishTypes(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },

        editType: async (id, name, order, isParent) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });
            try {
                const updatedType = await updateSongType(id, name, order, isParent);
                const updated = sortSongTypes(upsertById(
                    queryClient.getQueryData<readonly SongType[]>(queryKeys.songTypes(scope.tenantKey)),
                    updatedType,
                    'end'
                ));
                queryClient.setQueryData(queryKeys.songTypes(scope.tenantKey), updated);
                publishTypes(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },

        removeType: async (id) => {
            const scope = getTenantQueryScopeSnapshot();
            try {
                await deleteSongType(id);
                const updated = sortSongTypes(removeById(
                    queryClient.getQueryData<readonly SongType[]>(queryKeys.songTypes(scope.tenantKey)),
                    id
                ));
                queryClient.setQueryData(queryKeys.songTypes(scope.tenantKey), updated);
                publishTypes(updated);
                return true;
            } catch {
                return false;
            }
        },

        reset: () => set({ songs: [], songTypes: [], loading: false })
    };
});
