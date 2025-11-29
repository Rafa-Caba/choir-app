import choirApi from '../api/choirApi';
import type { Song, SongType, CreateSongPayload } from '../types/song';
import { Platform } from 'react-native';

// Helper: Async FormData
const createFormData = async (payload: any, audioUri?: string) => {
    const formData = new FormData();

    const { audioUri: _, ...dataPayload } = payload;

    // Backend expects simple JSON in 'data' field
    formData.append('data', JSON.stringify(dataPayload));

    // Append Audio File
    if (audioUri) {
        const filename = 'audio.m4a';
        const type = 'audio/m4a';

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(audioUri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } catch (e) { console.error("Web Audio Blob Error:", e); }
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    return formData;
};

// --- SONG TYPES ---

export const getSongTypes = async (): Promise<SongType[]> => {
    const { data } = await choirApi.get<any>('/song-types/public');
    return data.types || [];
};

// Updated to accept isParent
export const createSongType = async (name: string, order: number, parentId?: string, isParent?: boolean): Promise<SongType> => {
    const { data } = await choirApi.post<SongType>('/song-types', { name, order, parentId, isParent });
    return data;
};

// Updated to accept isParent
export const updateSongType = async (id: string, name: string, order: number, isParent?: boolean): Promise<SongType> => {
    const { data } = await choirApi.put<SongType>(`/song-types/${id}`, { name, order, isParent });
    return data;
};

export const deleteSongType = async (id: string): Promise<void> => {
    await choirApi.delete(`/song-types/${id}`);
};


// --- SONGS ---

export const getAllSongs = async (): Promise<Song[]> => {
    // Matches Backend: GET /api/songs/public
    const { data } = await choirApi.get<Song[]>('/songs/public');
    return data;
};

export const createSong = async (payload: CreateSongPayload, audioUri?: string): Promise<Song> => {
    const formData = await createFormData(payload, audioUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    // Matches Backend: POST /api/songs
    const { data } = await choirApi.post<Song>('/songs', formData, requestConfig);
    return data;
};

export const updateSong = async (id: string, payload: Partial<CreateSongPayload>, audioUri?: string): Promise<Song> => {
    const formData = await createFormData(payload, audioUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    // Matches Backend: PUT /api/songs/:id
    const { data } = await choirApi.put<Song>(`/songs/${id}`, formData, requestConfig);
    return data;
};

export const deleteSong = async (id: string): Promise<void> => {
    await choirApi.delete(`/songs/${id}`);
};