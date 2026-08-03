// src/services/song.ts

import choirApi from '../api/choirApi';
import type { CreateSongPayload, Song, SongType } from '../types/song';
import { appendLocalFile, getMultipartRequestConfig } from './multipart';

const createSongFormData = async (
    payload: Partial<CreateSongPayload>,
    audioUri?: string
): Promise<FormData> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (audioUri) {
        const filename = audioUri.split('?')[0].split('/').pop() ?? 'song-audio.m4a';
        await appendLocalFile(formData, 'file', {
            uri: audioUri,
            filename,
            mimeType: 'audio/m4a'
        });
    }

    return formData;
};

export const getSongTypes = async (): Promise<readonly SongType[]> => {
    const response = await choirApi.get<readonly SongType[]>('/song-types');
    return response.data;
};

export const createSongType = async (
    name: string,
    order: number,
    parentId?: string,
    isParent?: boolean
): Promise<SongType> => {
    const response = await choirApi.post<SongType>('/song-types', {
        name,
        order,
        parentId,
        isParent
    });
    return response.data;
};

export const updateSongType = async (
    id: string,
    name: string,
    order: number,
    isParent?: boolean
): Promise<SongType> => {
    const response = await choirApi.put<SongType>(`/song-types/${id}`, {
        name,
        order,
        isParent
    });
    return response.data;
};

export const deleteSongType = async (id: string): Promise<void> => {
    await choirApi.delete(`/song-types/${id}`);
};

export const getAllSongs = async (): Promise<readonly Song[]> => {
    const response = await choirApi.get<readonly Song[]>('/songs');
    return response.data;
};

export const createSong = async (
    payload: CreateSongPayload,
    audioUri?: string
): Promise<Song> => {
    const formData = await createSongFormData(payload, audioUri);
    const response = await choirApi.post<Song>('/songs', formData, getMultipartRequestConfig());
    return response.data;
};

export const updateSong = async (
    id: string,
    payload: Partial<CreateSongPayload>,
    audioUri?: string
): Promise<Song> => {
    const formData = await createSongFormData(payload, audioUri);
    const response = await choirApi.put<Song>(`/songs/${id}`, formData, getMultipartRequestConfig());
    return response.data;
};

export const deleteSong = async (id: string): Promise<void> => {
    await choirApi.delete(`/songs/${id}`);
};
