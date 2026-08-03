// src/services/admin/themes.ts

import choirApi from '../../api/choirApi';
import type { Theme } from '../../types/theme';

export const updateThemeDefinition = async (
    id: string,
    data: Theme
): Promise<Theme> => {
    const response = await choirApi.put<Theme>(`/themes/${id}`, {
        name: data.name,
        isDark: data.isDark,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        cardColor: data.cardColor,
        buttonColor: data.buttonColor,
        navColor: data.navColor,
        buttonTextColor: data.buttonTextColor,
        secondaryTextColor: data.secondaryTextColor,
        borderColor: data.borderColor
    });
    return response.data;
};
