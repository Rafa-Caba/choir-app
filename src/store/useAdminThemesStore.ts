import { create } from 'zustand';
import { ThemeDefinition } from '../types/theme';
import { getAllThemes } from '../services/theme';
import { updateThemeDefinition } from '../services/admin/themes';

interface AdminThemesState {
    themes: ThemeDefinition[];
    loading: boolean;
    fetchThemes: () => Promise<void>;
    saveTheme: (id: string, data: ThemeDefinition) => Promise<boolean>;
}

export const useAdminThemesStore = create<AdminThemesState>((set, get) => ({
    themes: [],
    loading: false,

    fetchThemes: async () => {
        set({ loading: true });
        try {
            const data = await getAllThemes();
            set({ themes: data });
        } catch (error) {
            console.error(error);
        } finally {
            set({ loading: false });
        }
    },

    saveTheme: async (id, data) => {
        set({ loading: true });
        try {
            const updated = await updateThemeDefinition(id, data);

            // Update local list
            set(state => ({
                themes: state.themes.map(t => t.id === id ? updated : t)
            }));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            set({ loading: false });
        }
    }
}));