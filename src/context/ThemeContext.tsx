import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { mapDbThemeToStyled } from '../utils/themeMapper';
import { getAllThemes, updateUserTheme } from '../services/themes';
import { useAuthStore } from '../store/useAuthStore';
import type { ThemeDefinition } from '../types/theme';
import { ActivityIndicator, View } from 'react-native';

// Default fallback to prevent crash before load
const defaultDbTheme: ThemeDefinition = {
    id: 0, name: 'Loading', isDark: false,
    primaryColor: '#a88ff7', accentColor: '#673ab7', backgroundColor: '#fff',
    textColor: '#333', cardColor: '#fff', buttonColor: '#6a0dad', navColor: '#fff'
};

interface ThemeContextProps {
    currentTheme: DefaultTheme;
    availableThemes: ThemeDefinition[];
    setThemeById: (id: number) => Promise<void>;
}

export const ThemeContext = createContext({} as ThemeContextProps);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themes, setThemes] = useState<ThemeDefinition[]>([]);
    const [activeThemeId, setActiveThemeId] = useState<number | null>(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAllThemes();
                
                setThemes(data);
                
                // Priority: User Pref -> First Available
                if (user?.themeId) {
                    setActiveThemeId(user.themeId);
                } else if (data.length > 0) {
                    setActiveThemeId(data[0].id);
                }
            } catch (e) {
                console.error("Failed to load themes", e);
            }
        };
        load();
    }, [user?.themeId]); // Reload if user changes (login)

    const setThemeById = async (id: number) => {
        setActiveThemeId(id); // Instant UI update
        if (user) {
            try {
                await updateUserTheme(id); // Save to DB
            } catch (e) {
                console.error("Failed to save theme preference", e);
            }
        }
    };

    // Calculate the styled object
    const activeThemeDef = themes.find(t => t.id === activeThemeId) || defaultDbTheme;
    const styledTheme = mapDbThemeToStyled(activeThemeDef);

    if (themes.length === 0) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color="#8B4BFF"/></View>;

    return (
        <ThemeContext.Provider value={{ 
            currentTheme: styledTheme, 
            availableThemes: themes, 
            setThemeById 
        }}>
            <StyledThemeProvider theme={styledTheme}>
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);