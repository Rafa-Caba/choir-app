import choirApi from '../api/choirApi';
import type { Song, SongPayload, SongType } from '../types/song';

// --- Song Types ---
export const getSongTypes = async (): Promise<SongType[]> => {
    const { data } = await choirApi.get<SongType[]>('/song-types');
    return data;
};

// --- Songs ---
export const getAllSongs = async (): Promise<Song[]> => {
    const { data } = await choirApi.get<Song[]>('/songs');
    return data;
};

export const createSong = async (payload: SongPayload): Promise<Song> => {
    const { data } = await choirApi.post<Song>('/songs', payload);
    return data;
};

export const updateSong = async (id: number, payload: SongPayload): Promise<Song> => {
    const { data } = await choirApi.put<Song>(`/songs/${id}`, payload);
    return data;
};