// src/services/theme.ts

import axios from 'axios';
import choirApi from '../api/choirApi';
import type { CreateThemePayload, Theme } from '../types/theme';

const THEME_MUTATION_TIMEOUT_MS = 6_000;
const THEME_UPDATE_RETRY_DELAY_MS = 250;

const delay = async (milliseconds: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, milliseconds);
    });
};

const isTransientRequestFailure = (error: Error): boolean => {
    if (!axios.isAxiosError(error)) {
        return false;
    }

    return !error.response ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK';
};

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
    try {
        const response = await choirApi.put<Theme>(`/themes/${id}`, payload, {
            timeout: THEME_MUTATION_TIMEOUT_MS
        });
        return response.data;
    } catch (error) {
        if (!(error instanceof Error) || !isTransientRequestFailure(error)) {
            throw error;
        }

        await delay(THEME_UPDATE_RETRY_DELAY_MS);
        const retryResponse = await choirApi.put<Theme>(`/themes/${id}`, payload, {
            timeout: THEME_MUTATION_TIMEOUT_MS
        });
        return retryResponse.data;
    }
};

export const deleteTheme = async (id: string): Promise<void> => {
    await choirApi.delete(`/themes/${id}`);
};
