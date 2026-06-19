// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAllThemes } from '../services/theme';
import { updateTheme as persistUserTheme } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import type { Theme } from '../types/theme';

const DEFAULT_THEME: Theme = {
    id: 'default',
    name: 'Default Light',
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
    borderColor: '#e0e0e0',
};

interface ThemeContextType {
    currentTheme: Theme;
    availableThemes: Theme[];
    setTheme: (theme: Theme) => void;
    setThemeById: (id: string) => Promise<void>;
    loading: boolean;
    colors: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    currentTheme: DEFAULT_THEME,
    availableThemes: [],
    setTheme: () => { },
    setThemeById: async () => { },
    loading: false,
    colors: DEFAULT_THEME,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
    const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
    const [loading, setLoading] = useState<boolean>(true);

    const user = useAuthStore((s) => s.user);

    const isInitializingRef = useRef(false);

    const userThemeId = useMemo(() => {
        if (!user?.themeId) return null;
        return typeof user.themeId === 'object' ? user.themeId.id : user.themeId;
    }, [user?.themeId]);

    const initThemes = async () => {
        if (isInitializingRef.current) return;
        isInitializingRef.current = true;

        try {
            setLoading(true);

            const themes = await getAllThemes();
            const safeThemes = Array.isArray(themes) ? themes : [];

            setAvailableThemes(safeThemes);

            let active: Theme = safeThemes[0] ?? DEFAULT_THEME;

            if (userThemeId) {
                const found = safeThemes.find((t) => t?.id === userThemeId);
                if (found) active = found;
            }

            setCurrentTheme(active);
        } catch (error) {
            console.error('Error initializing themes:', error);
            if (!currentTheme?.id) setCurrentTheme(DEFAULT_THEME);
            setAvailableThemes([]);
        } finally {
            setLoading(false);
            isInitializingRef.current = false;
        }
    };

    // Re-init when auth user changes OR their theme preference changes
    useEffect(() => {
        initThemes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, userThemeId]);

    const setTheme = (theme: Theme) => {
        if (!theme?.id) return;
        setCurrentTheme(theme);
    };

    const setThemeById = async (id: string) => {
        const theme = availableThemes.find((t) => t.id === id);
        if (!theme) return;

        setCurrentTheme(theme);

        if (user?.id) {
            try {
                await persistUserTheme(id);
            } catch (error) {
                console.error('Failed to save theme preference', error);
            }
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                availableThemes,
                setTheme,
                setThemeById,
                loading,
                colors: currentTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
