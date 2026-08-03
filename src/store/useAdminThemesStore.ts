// src/store/useAdminThemesStore.ts

import { create } from 'zustand';
import { updateThemeDefinition } from '../services/admin/themes';
import { getAllThemes } from '../services/theme';
import type { Theme } from '../types/theme';

interface AdminThemesState {
    themes: Theme[];
    loading: boolean;
    fetchThemes: () => Promise<void>;
    saveTheme: (id: string, data: Theme) => Promise<boolean>;
    reset: () => void;
}

export const useAdminThemesStore = create<AdminThemesState>((set) => ({
    themes: [],
    loading: false,

    fetchThemes: async () => {
        set({ loading: true });
        try {
            const data = await getAllThemes();
            set({ themes: [...data] });
        } finally {
            set({ loading: false });
        }
    },

    saveTheme: async (id, data) => {
        set({ loading: true });
        try {
            const updated = await updateThemeDefinition(id, data);
            set((state) => ({
                themes: state.themes.map((theme) => theme.id === id ? updated : theme)
            }));
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    reset: () => set({ themes: [], loading: false })
}));
