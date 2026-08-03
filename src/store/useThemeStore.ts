// src/store/useThemeStore.ts

import { create } from 'zustand';
import {
    createTheme,
    deleteTheme,
    updateTheme
} from '../services/theme';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import type { CreateThemePayload, Theme } from '../types/theme';
import { useAuthStore } from './useAuthStore';

interface ThemeState {
    themes: Theme[];
    publicThemes: Theme[];
    loading: boolean;
    fetchThemes: () => Promise<void>;
    fetchPublicThemes: () => Promise<void>;
    addTheme: (payload: CreateThemePayload) => Promise<boolean>;
    editTheme: (id: string, payload: Partial<CreateThemePayload>) => Promise<boolean>;
    removeTheme: (id: string) => Promise<boolean>;
    reset: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
    const fetchThemes = async (): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();
        if (!context) return;
        set({ loading: true });

        try {
            const result = await syncCacheFirst<readonly Theme[]>({
                context,
                resource: 'themes',
                path: '/themes',
                ttlMs: CACHE_TTL_MS.themes,
                onData: (data) => set({ themes: [...data], publicThemes: [...data] })
            });
            set({ themes: [...result.data], publicThemes: [...result.data] });
        } finally {
            set({ loading: false });
        }
    };

    return {
        themes: [],
        publicThemes: [],
        loading: false,
        fetchThemes,
        fetchPublicThemes: fetchThemes,
        addTheme: async (payload) => {
            set({ loading: true });
            try {
                await createTheme(payload);
                await fetchThemes();
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        editTheme: async (id, payload) => {
            set({ loading: true });
            try {
                await updateTheme(id, payload);
                await fetchThemes();
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        removeTheme: async (id) => {
            try {
                await deleteTheme(id);
                await fetchThemes();
                return true;
            } catch {
                return false;
            }
        },
        reset: () => set({ themes: [], publicThemes: [], loading: false })
    };
});
