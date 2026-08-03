// src/services/theme.ts

import choirApi from '../api/choirApi';
import type { CreateThemePayload, Theme } from '../types/theme';

export const getAllThemes = async (): Promise<readonly Theme[]> => {
    const response = await choirApi.get<readonly Theme[]>('/themes');
    return response.data;
};

export const createTheme = async (payload: CreateThemePayload): Promise<Theme> => {
    const response = await choirApi.post<Theme>('/themes', payload);
    return response.data;
};

export const updateTheme = async (
    id: string,
    payload: Partial<CreateThemePayload>
): Promise<Theme> => {
    const response = await choirApi.put<Theme>(`/themes/${id}`, payload);
    return response.data;
};

export const deleteTheme = async (id: string): Promise<void> => {
    await choirApi.delete(`/themes/${id}`);
};
