import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAllThemes, createTheme, updateTheme, deleteTheme, getPublicThemes
} from '../services/theme';
import type { Theme, CreateThemePayload } from '../types/theme';

interface ThemeState {
    themes: Theme[];
    publicThemes: Theme[];
    loading: boolean;

    fetchThemes: () => Promise<void>;
    fetchPublicThemes: () => Promise<void>;

    addTheme: (payload: CreateThemePayload) => Promise<boolean>;
    editTheme: (id: string, payload: Partial<CreateThemePayload>) => Promise<boolean>;
    removeTheme: (id: string) => Promise<boolean>;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themes: [],
            publicThemes: [],
            loading: false,

            fetchThemes: async () => {
                set({ loading: true });
                try {
                    const data = await getAllThemes();
                    set({ themes: Array.isArray(data) ? data : [] });
                } catch (e) { console.error("Fetch Themes Error:", e); }
                finally { set({ loading: false }); }
            },

            fetchPublicThemes: async () => {
                try {
                    const data = await getPublicThemes();
                    set({ publicThemes: Array.isArray(data) ? data : [] });
                } catch (e) { console.log("Offline: Using cached themes"); }
            },

            addTheme: async (payload) => {
                set({ loading: true });
                try {
                    await createTheme(payload);
                    await get().fetchThemes();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            editTheme: async (id, payload) => {
                set({ loading: true });
                try {
                    await updateTheme(id, payload);
                    await get().fetchThemes();
                    return true;
                } catch (e) { return false; }
                finally { set({ loading: false }); }
            },

            removeTheme: async (id) => {
                try {
                    await deleteTheme(id);
                    set(state => ({ themes: state.themes.filter(t => t.id !== id) }));
                    return true;
                } catch (e) { return false; }
            }
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);