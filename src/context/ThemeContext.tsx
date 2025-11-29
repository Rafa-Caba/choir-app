import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAllThemes } from '../services/theme';
import { updateTheme as persistUserTheme } from '../services/auth'; // Persist to user profile
import { useAuthStore } from '../store/useAuthStore';
import type { Theme } from '../types/theme';

// Default Fallback Theme
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
    borderColor: '#e0e0e0'
};

interface ThemeContextType {
    currentTheme: Theme;
    availableThemes: Theme[];
    setTheme: (theme: Theme) => void; // Direct setter
    setThemeById: (id: string) => void; // ID-based setter
    loading: boolean;
    colors: Theme; // Alias
}

const ThemeContext = createContext<ThemeContextType>({
    currentTheme: DEFAULT_THEME,
    availableThemes: [],
    setTheme: () => { },
    setThemeById: () => { },
    loading: false,
    colors: DEFAULT_THEME
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
    const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);

    const { user } = useAuthStore();

    const initThemes = async () => {
        try {
            setLoading(true);
            // Fetch all themes from backend
            const themes = await getAllThemes();
            setAvailableThemes(themes);

            // Determine active theme
            if (themes.length > 0) {
                let active = themes[0]; // Default to first

                // 1. User Preference (if logged in)
                if (user?.themeId) {
                    // themeId might be a string ID or a populated Object
                    const userThemeId = typeof user.themeId === 'object' ? user.themeId.id : user.themeId;
                    const found = themes.find(t => t.id === userThemeId);
                    if (found) active = found;
                }

                setCurrentTheme(active);
            }
        } catch (error) {
            console.error('Error initializing themes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reload when user logs in/out to apply their preference
    useEffect(() => {
        initThemes();
    }, [user]);

    // Manual Setter (Optimistic)
    const setTheme = (theme: Theme) => {
        setCurrentTheme(theme);
    };

    // ID-based Setter (Persists to Backend)
    const setThemeById = async (id: string) => {
        const theme = availableThemes.find(t => t.id === id);
        if (theme) {
            // 1. Update UI immediately
            setCurrentTheme(theme);

            // 2. Persist to User Profile (if logged in)
            if (user) {
                try {
                    await persistUserTheme(id);
                } catch (error) {
                    console.error("Failed to save theme preference", error);
                }
            }
        }
    };

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            availableThemes,
            setTheme,
            setThemeById,
            loading,
            colors: currentTheme // Alias for convenience
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);