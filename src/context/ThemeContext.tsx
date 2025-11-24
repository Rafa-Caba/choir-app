import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { mapDbThemeToStyled } from '../utils/themeMapper';
import { getAllThemes, updateUserTheme } from '../services/themes';
import { useAuthStore } from '../store/useAuthStore';
import type { ThemeDefinition } from '../types/theme';
import { ActivityIndicator, View } from 'react-native';

// Default fallback to prevent crash before load
const defaultDbTheme: ThemeDefinition = {
    id: 0, 
    name: 'Loading', 
    isDark: false,
    primaryColor: '#a88ff7', 
    accentColor: '#673ab7', 
    backgroundColor: '#fff',
    textColor: '#333', 
    cardColor: '#fff', 
    buttonColor: '#6a0dad', 
    navColor: '#fff'
};

interface ThemeContextProps {
    currentTheme: DefaultTheme;
    availableThemes: ThemeDefinition[];
    setThemeById: (id: number) => Promise<void>;
    loading: boolean;
    themeName: 'light' | 'dark'; // Legacy prop
    isDark: boolean;
    toggleTheme: () => void;
}

export const ThemeContext = createContext({} as ThemeContextProps);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themes, setThemes] = useState<ThemeDefinition[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getAllThemes();
                setThemes(data);
                
                // Determine active theme: Priority: User Pref -> LocalStorage -> First Available
                const storedId = localStorage.getItem('sweeties-theme-id'); // Or AsyncStorage for mobile

                if (user?.themeId) {
                    setActiveThemeId(user.themeId);
                } else if (storedId) {
                    setActiveThemeId(Number(storedId));
                } else if (data.length > 0) {
                    setActiveThemeId(data[0].id);
                }
            } catch (e) {
                console.error("Failed to load themes", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.themeId]); 

    const setThemeById = async (id: number) => {
        setActiveThemeId(id); // Instant UI update
        // Optional: Save locally
        // await AsyncStorage.setItem('sweeties-theme-id', String(id)); 
        
        if (user) {
            try {
                await updateUserTheme(id); // Save to DB
            } catch (e) {
                console.error("Failed to save theme preference", e);
            }
        }
    };

    // Toggle Logic (Sun/Moon button)
    const toggleTheme = () => {
        if (!themes.length) return;
        // Look for specific themes by name
        const lightTheme = themes.find(t => t.name === 'Clásico');
        const darkTheme = themes.find(t => t.name === 'Noche');
        
        if (!lightTheme || !darkTheme) return;

        if (activeThemeId === darkTheme.id) {
            setThemeById(lightTheme.id);
        } else {
            setThemeById(darkTheme.id);
        }
    };

    // Calculate the styled object
    const activeThemeDef = themes.find(t => t.id === activeThemeId) || themes[0] || defaultDbTheme;
    const styledTheme = mapDbThemeToStyled(activeThemeDef);

    // NOTE: We removed the blocking spinner here so the app can render "No themes" or login screen immediately
    
    return (
        <ThemeContext.Provider value={{ 
            currentTheme: styledTheme, 
            availableThemes: themes, 
            setThemeById,
            loading,
            themeName: styledTheme.isDark ? 'dark' : 'light',
            isDark: styledTheme.isDark,
            toggleTheme
        }}>
            <StyledThemeProvider theme={styledTheme}>
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);