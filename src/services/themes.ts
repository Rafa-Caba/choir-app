import choirApi from '../api/choirApi';
import type { ThemeDefinition } from '../types/theme';

// GET /api/themes
export const getAllThemes = async (): Promise<ThemeDefinition[]> => {
    const { data } = await choirApi.get<ThemeDefinition[]>('/themes');
    
    return data;
};

// PUT /api/users/me/theme
export const updateUserTheme = async (themeId: number): Promise<void> => {
    // Your controller expects a map: { "themeId": 1 }
    await choirApi.put('/users/me/theme', { themeId });
};