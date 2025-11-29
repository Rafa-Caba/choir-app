import choirApi from '../api/choirApi';
import type { Theme, CreateThemePayload } from '../types/theme';

// GET Public (Active themes for selection)
export const getPublicThemes = async (): Promise<Theme[]> => {
    const { data } = await choirApi.get<{ themes: Theme[] }>('/themes/public');
    return data.themes || [];
};

// GET Admin (List all)
export const getAllThemes = async (): Promise<Theme[]> => {
    // Backend returns paginated object { themes: [], total... }
    // We can grab just the array for the store list
    const { data } = await choirApi.get<any>('/themes?all=true');
    return data.themes || [];
};

// CREATE
export const createTheme = async (payload: CreateThemePayload): Promise<Theme> => {
    const { data } = await choirApi.post<{ theme: Theme, message: string }>('/themes', payload);
    return data.theme;
};

// UPDATE
export const updateTheme = async (id: string, payload: Partial<CreateThemePayload>): Promise<Theme> => {
    const { data } = await choirApi.put<{ theme: Theme, message: string }>(`/themes/${id}`, payload);
    return data.theme;
};

// DELETE
export const deleteTheme = async (id: string): Promise<void> => {
    await choirApi.delete(`/themes/${id}`);
};