import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import choirApi from '../api/choirApi';
import { useAuthStore } from '../store/useAuthStore';
import type { ThemeDefinition } from '../types/theme';
import { DefaultTheme } from 'styled-components/native'; 
import { mapDbThemeToStyled } from '../utils/themeMapper'; 

// --- Define a Safe Default Theme (Matches your DB 'Clásico' structure) ---
const DEFAULT_THEME_DEF: ThemeDefinition = {
    id: 1,
    name: 'Clásico',
    isDark: false,
    primaryColor: '#6200ea',
    accentColor: '#00b0ff',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    cardColor: '#f5f5f5',
    buttonColor: '#6200ea',
    navColor: '#ffffff',
    buttonTextColor: '#ffffff',
    secondaryTextColor: '#666666',
    borderColor: '#eeeeee'
};

interface ThemeContextProps {
    currentTheme: DefaultTheme;
    availableThemes: ThemeDefinition[];
    setThemeById: (id: number) => Promise<void>;
    loading: boolean;
    themeName: 'light' | 'dark';
    isDark: boolean;
    toggleTheme: () => void;
}

export const ThemeContext = createContext({} as ThemeContextProps);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [themes, setThemes] = useState<ThemeDefinition[]>([DEFAULT_THEME_DEF]);
    const [activeThemeId, setActiveThemeId] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    // --- Initial Load (Local Storage + API) ---
    useEffect(() => {
        const initTheme = async () => {
            try {
                const savedId = await AsyncStorage.getItem('user_theme_id');
                if (savedId) {
                    setActiveThemeId(Number(savedId));
                } else if (user?.themeId) {
                    setActiveThemeId(user.themeId);
                }

                const { data } = await choirApi.get<ThemeDefinition[]>('/themes');
                setThemes(data);
                
                if (savedId) {
                    const exists = data.find(t => t.id === Number(savedId));
                    if (!exists && data.length > 0) setActiveThemeId(data[0].id);
                }

            } catch (e) {
                console.log("Theme load error (using defaults):", e);
            } finally {
                setLoading(false);
            }
        };

        initTheme();
    }, [user?.themeId]); 

    const setThemeById = async (id: number) => {
        setActiveThemeId(id);
        
        await AsyncStorage.setItem('user_theme_id', String(id));

        if (user) {
            try {
                await choirApi.put('/users/me/theme', { themeId: id });
            } catch (e) {
                console.error("Failed to sync theme to cloud", e);
            }
        }
    };

    const toggleTheme = () => {
        const currentDef = themes.find(t => t.id === activeThemeId) || themes[0];
        
        const targetTheme = themes.find(t => t.isDark !== currentDef.isDark);
        
        if (targetTheme) {
            setThemeById(targetTheme.id);
        }
    };

    const activeThemeDef = themes.find(t => t.id === activeThemeId) || themes[0] || DEFAULT_THEME_DEF;
    
    const styledTheme = mapDbThemeToStyled(activeThemeDef);

    return (
        <ThemeContext.Provider value={{ 
            currentTheme: styledTheme, 
            availableThemes: themes, 
            setThemeById,
            loading,
            themeName: activeThemeDef.isDark ? 'dark' : 'light',
            isDark: activeThemeDef.isDark,
            toggleTheme
        }}>
            <StyledThemeProvider theme={styledTheme}>
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);