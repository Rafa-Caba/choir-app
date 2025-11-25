import choirApi from '../api/choirApi';
import type { Song, SongPayload, SongType } from '../types/song';
import { Platform } from 'react-native';

// --- Helper: Build FormData ---
const createFormData = (payload: any, audioUri?: string) => {
    const formData = new FormData();
    
    // 1. Append JSON as String (Matches @RequestPart("data") String)
    formData.append('data', JSON.stringify(payload));

    // 2. Append File (if exists)
    if (audioUri) {
        const filename = audioUri.split('/').pop() || 'audio.mp3';
        const type = 'audio/mpeg'; // Generic audio type
        
        // @ts-ignore - React Native specific FormData
        formData.append('file', {
            uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
            name: filename,
            type: type
        });
    }

    return formData;
};

// --- Song Types ---
export const getSongTypes = async (): Promise<SongType[]> => {
    const { data } = await choirApi.get<SongType[]>('/song-types');
    return data;
};

export const createSongType = async (name: string, order: number): Promise<SongType> => {
    const { data } = await choirApi.post<SongType>('/song-types', { name, order });
    return data;
};

export const updateSongType = async (id: number, name: string, order: number): Promise<SongType> => {
    const { data } = await choirApi.put<SongType>(`/song-types/${id}`, { name, order });
    return data;
};

export const deleteSongType = async (id: number): Promise<void> => {
    await choirApi.delete(`/song-types/${id}`);
};

// --- Songs ---
export const getAllSongs = async (): Promise<Song[]> => {
    const { data } = await choirApi.get<Song[]>('/songs');
    return data;
};

// Modified to accept audioUri
export const createSong = async (payload: SongPayload, audioUri?: string): Promise<Song> => {
    const formData = createFormData(payload, audioUri);
    const { data } = await choirApi.post<Song>('/songs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateSong = async (id: number, payload: SongPayload, audioUri?: string): Promise<Song> => {
    const formData = createFormData(payload, audioUri);
    const { data } = await choirApi.put<Song>(`/songs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteSong = async (id: number): Promise<void> => {
    await choirApi.delete(`/songs/${id}`);
};