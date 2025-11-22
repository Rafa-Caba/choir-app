import choirApi from '../../api/choirApi';
import type { ThemeDefinition } from '../../types/theme';

// PUT /api/themes/{id}
export const updateThemeDefinition = async (id: number, data: ThemeDefinition): Promise<ThemeDefinition> => {
    const { data: response } = await choirApi.put<ThemeDefinition>(`/themes/${id}`, data);
    return response;
};