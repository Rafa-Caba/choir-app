// src/services/song.ts

import choirApi from '../api/choirApi';
import type { CreateSongPayload, Song, SongContent, SongType } from '../types/song';
import {
    appendLocalFile,
    createLocalUpload,
    getMultipartRequestConfig
} from './multipart';

interface RawSongTypeParent {
    readonly _id?: string;
    readonly id?: string;
    readonly name?: string;
}

interface RawSongType {
    readonly _id?: string;
    readonly id?: string;
    readonly name: string;
    readonly order: number;
    readonly parentId?: string | RawSongTypeParent | null;
    readonly isParent: boolean;
    readonly updatedAt?: string;
}

interface RawSong {
    readonly _id?: string;
    readonly id?: string;
    readonly title: string;
    readonly composer?: string;
    readonly content: SongContent;
    readonly songTypeId?: string | RawSongTypeParent | null;
    readonly songTypeName?: string;
    readonly audioUrl?: string;
    readonly cachedAudioUrl?: string | null;
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

const resolveSongTypeId = (songType: RawSongType): string => {
    const id = songType.id ?? songType._id;

    if (!id) {
        throw new Error('Song type response does not include an id');
    }

    return id;
};

const resolveParentId = (
    parentId: RawSongType['parentId']
): string | null => {
    if (!parentId) {
        return null;
    }

    if (typeof parentId === 'string') {
        return parentId;
    }

    return parentId.id ?? parentId._id ?? null;
};

const resolveRawSongTypeId = (
    songTypeId: RawSong['songTypeId']
): string | null => {
    if (!songTypeId) {
        return null;
    }

    if (typeof songTypeId === 'string') {
        return songTypeId;
    }

    return songTypeId.id ?? songTypeId._id ?? null;
};

const resolveRawSongTypeName = (song: RawSong): string => {
    if (song.songTypeName) {
        return song.songTypeName;
    }

    if (song.songTypeId && typeof song.songTypeId !== 'string') {
        return song.songTypeId.name ?? '';
    }

    return '';
};

const normalizeSongType = (songType: RawSongType): SongType => ({
    id: resolveSongTypeId(songType),
    name: songType.name,
    order: songType.order,
    parentId: resolveParentId(songType.parentId),
    isParent: songType.isParent,
    updatedAt: songType.updatedAt
});

const normalizeSong = (song: RawSong): Song => {
    const id = song.id ?? song._id;

    if (!id) {
        throw new Error('Song response does not include an id');
    }

    const createdAt = song.createdAt ?? new Date().toISOString();

    return {
        id,
        title: song.title,
        composer: song.composer,
        content: song.content,
        songTypeId: resolveRawSongTypeId(song.songTypeId),
        songTypeName: resolveRawSongTypeName(song),
        audioUrl: song.audioUrl,
        cachedAudioUrl: song.cachedAudioUrl,
        createdAt,
        updatedAt: song.updatedAt ?? createdAt
    };
};

const createSongFormData = async (
    payload: Partial<CreateSongPayload>,
    audioUri?: string
): Promise<FormData> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (audioUri) {
        await appendLocalFile(
            formData,
            'file',
            createLocalUpload(audioUri, 'song-audio.m4a', 'audio/mp4')
        );
    }

    return formData;
};

export const getSongTypes = async (): Promise<readonly SongType[]> => {
    const response = await choirApi.get<readonly RawSongType[]>('/song-types');
    return response.data.map(normalizeSongType);
};

export const createSongType = async (
    name: string,
    order: number,
    parentId?: string,
    isParent?: boolean
): Promise<SongType> => {
    const response = await choirApi.post<RawSongType>('/song-types', {
        name,
        order,
        parentId,
        isParent
    });
    return normalizeSongType(response.data);
};

export const updateSongType = async (
    id: string,
    name: string,
    order: number,
    isParent?: boolean
): Promise<SongType> => {
    const response = await choirApi.put<RawSongType>(`/song-types/${id}`, {
        name,
        order,
        isParent
    });
    return normalizeSongType(response.data);
};

export const deleteSongType = async (id: string): Promise<void> => {
    await choirApi.delete(`/song-types/${id}`);
};

export const getAllSongs = async (): Promise<readonly Song[]> => {
    const response = await choirApi.get<readonly RawSong[]>('/songs');
    return response.data.map(normalizeSong);
};

export const createSong = async (
    payload: CreateSongPayload,
    audioUri?: string
): Promise<Song> => {
    const formData = await createSongFormData(payload, audioUri);
    const response = await choirApi.post<RawSong>('/songs', formData, getMultipartRequestConfig());
    return normalizeSong(response.data);
};

export const updateSong = async (
    id: string,
    payload: Partial<CreateSongPayload>,
    audioUri?: string
): Promise<Song> => {
    const formData = await createSongFormData(payload, audioUri);
    const response = await choirApi.put<RawSong>(`/songs/${id}`, formData, getMultipartRequestConfig());
    return normalizeSong(response.data);
};

export const deleteSong = async (id: string): Promise<void> => {
    await choirApi.delete(`/songs/${id}`);
};
