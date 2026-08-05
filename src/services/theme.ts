// src/services/theme.ts

import choirApi from '../api/choirApi';
import type { CreateThemePayload, Theme } from '../types/theme';

const THEME_MUTATION_TIMEOUT_MS = 8_000;

export const getAllThemes = async (): Promise<readonly Theme[]> => {
    const response = await choirApi.get<readonly Theme[]>('/themes');
    return response.data;
};

export const createTheme = async (payload: CreateThemePayload): Promise<Theme> => {
    const response = await choirApi.post<Theme>('/themes', payload, {
        timeout: THEME_MUTATION_TIMEOUT_MS
    });
    return response.data;
};

export const updateTheme = async (
    id: string,
    payload: Partial<CreateThemePayload>
): Promise<Theme> => {
    const response = await choirApi.put<Theme>(`/themes/${id}`, payload, {
        timeout: THEME_MUTATION_TIMEOUT_MS
    });
    return response.data;
};

export const deleteTheme = async (id: string): Promise<void> => {
    await choirApi.delete(`/themes/${id}`, { timeout: THEME_MUTATION_TIMEOUT_MS });
};
