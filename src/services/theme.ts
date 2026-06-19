import choirApi from '../api/choirApi';
import type { Theme } from '../types/theme';
import { useAuthStore } from '../store/useAuthStore';

type ThemeApiResponse = Theme[] | { themes?: Theme[] } | any;

const getToken = () => useAuthStore.getState().token;

const normalizeThemes = (data: ThemeApiResponse): Theme[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.themes)) return data.themes;
    return [];
};

// PUBLIC
export const getPublicThemes = async (): Promise<Theme[]> => {
    const { data } = await choirApi.get<ThemeApiResponse>('/themes/public');
    return normalizeThemes(data);
};

// PROTECTED
export const getProtectedThemes = async (): Promise<Theme[]> => {
    const { data } = await choirApi.get<ThemeApiResponse>('/themes');
    return normalizeThemes(data);
};

// SMART (token -> protected, else public; fallback on 401/403)
export const getAllThemes = async (): Promise<Theme[]> => {
    const token = getToken();

    if (!token) {
        return await getPublicThemes();
    }

    try {
        return await getProtectedThemes();
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
            return await getPublicThemes();
        }
        throw err;
    }
};
