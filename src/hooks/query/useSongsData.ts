// src/hooks/query/useSongsData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createSong,
    createSongType,
    deleteSong,
    deleteSongType,
    getAllSongs,
    getSongTypes,
    updateSong,
    updateSongType
} from '../../services/song';
import type { CreateSongPayload, Song, SongType } from '../../types/song';
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useTenantQueryScope } from './useTenantQueryScope';

interface CreateSongVariables {
    readonly payload: CreateSongPayload;
    readonly audioUri?: string;
}

interface UpdateSongVariables {
    readonly id: string;
    readonly payload: Partial<CreateSongPayload>;
    readonly audioUri?: string;
}

interface CreateSongTypeVariables {
    readonly name: string;
    readonly order: number;
    readonly parentId?: string;
    readonly isParent?: boolean;
}

interface UpdateSongTypeVariables {
    readonly id: string;
    readonly name: string;
    readonly order: number;
    readonly isParent?: boolean;
}

const sortSongTypes = (items: readonly SongType[]): readonly SongType[] =>
    [...items].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));

export const useSongsQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.songs(scope.tenantKey),
        queryFn: getAllSongs,
        enabled: scope.enabled
    });
};

export const useSongTypesQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.songTypes(scope.tenantKey),
        queryFn: getSongTypes,
        enabled: scope.enabled,
        select: sortSongTypes
    });
};

export const useCreateSongMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ payload, audioUri }: CreateSongVariables) => createSong(payload, audioUri),
        onSuccess: (created) => {
            queryClient.setQueryData<readonly Song[]>(
                queryKeys.songs(scope.tenantKey),
                (current) => upsertById(current, created)
            );
        }
    });
};

export const useUpdateSongMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, payload, audioUri }: UpdateSongVariables) => updateSong(id, payload, audioUri),
        onSuccess: (updated) => {
            queryClient.setQueryData<readonly Song[]>(
                queryKeys.songs(scope.tenantKey),
                (current) => upsertById(current, updated)
            );
        }
    });
};

export const useDeleteSongMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: deleteSong,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly Song[]>(
                queryKeys.songs(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};

export const useCreateSongTypeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (variables: CreateSongTypeVariables) => createSongType(
            variables.name,
            variables.order,
            variables.parentId,
            variables.isParent
        ),
        onSuccess: (created) => {
            queryClient.setQueryData<readonly SongType[]>(
                queryKeys.songTypes(scope.tenantKey),
                (current) => sortSongTypes(upsertById(current, created, 'end'))
            );
        }
    });
};

export const useUpdateSongTypeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (variables: UpdateSongTypeVariables) => updateSongType(
            variables.id,
            variables.name,
            variables.order,
            variables.isParent
        ),
        onSuccess: (updated) => {
            queryClient.setQueryData<readonly SongType[]>(
                queryKeys.songTypes(scope.tenantKey),
                (current) => sortSongTypes(upsertById(current, updated, 'end'))
            );
        }
    });
};

export const useDeleteSongTypeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: deleteSongType,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly SongType[]>(
                queryKeys.songTypes(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};
