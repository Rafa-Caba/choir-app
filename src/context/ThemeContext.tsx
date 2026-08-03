// src/context/ThemeContext.tsx

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { updateTheme as persistUserTheme } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import type { Theme } from '../types/theme';

const DEFAULT_THEME: Theme = {
    id: 'default',
    name: 'Predeterminado',
    isDark: false,
    primaryColor: '#6200EE',
    accentColor: '#03DAC6',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    cardColor: '#f5f5f5',
    buttonColor: '#6200EE',
    navColor: '#ffffff',
    buttonTextColor: '#ffffff',
    secondaryTextColor: '#666666',
    borderColor: '#e0e0e0'
};

interface ThemeContextType {
    readonly currentTheme: Theme;
    readonly availableThemes: readonly Theme[];
    readonly setTheme: (theme: Theme) => void;
    readonly setThemeById: (id: string) => Promise<void>;
    readonly loading: boolean;
    readonly colors: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    currentTheme: DEFAULT_THEME,
    availableThemes: [],
    setTheme: () => undefined,
    setThemeById: async () => undefined,
    loading: false,
    colors: DEFAULT_THEME
});

const resolveThemeId = (themeId: string | Theme | null | undefined): string | null => {
    if (!themeId) return null;
    return typeof themeId === 'string' ? themeId : themeId.id;
};

export const ThemeProvider = ({ children }: { readonly children: React.ReactNode }) => {
    const status = useAuthStore((state) => state.status);
    const user = useAuthStore((state) => state.user);
    const replaceUser = useAuthStore((state) => state.replaceUser);
    const themes = useThemeStore((state) => state.themes);
    const loading = useThemeStore((state) => state.loading);
    const fetchThemes = useThemeStore((state) => state.fetchThemes);
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
    const userThemeId = resolveThemeId(user?.themeId);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchThemes().catch(() => undefined);
        } else {
            setSelectedThemeId(null);
        }
    }, [fetchThemes, status, user?.id]);

    useEffect(() => {
        setSelectedThemeId(userThemeId);
    }, [userThemeId]);

    const currentTheme = useMemo(() => {
        const preferredId = selectedThemeId ?? userThemeId;
        return themes.find((theme) => theme.id === preferredId) ?? themes[0] ?? DEFAULT_THEME;
    }, [selectedThemeId, themes, userThemeId]);

    const setTheme = (theme: Theme): void => {
        setSelectedThemeId(theme.id);
    };

    const setThemeById = async (id: string): Promise<void> => {
        const theme = themes.find((item) => item.id === id);

        if (!theme) return;
        setSelectedThemeId(id);

        if (user) {
            const updatedUser = await persistUserTheme(id);
            await replaceUser(updatedUser);
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                availableThemes: themes,
                setTheme,
                setThemeById,
                loading,
                colors: currentTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
