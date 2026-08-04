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

const upsertTheme = (
    themes: readonly Theme[],
    incoming: Theme
): Theme[] => {
    const exists = themes.some((theme) => theme.id === incoming.id);

    if (!exists) {
        return [...themes, incoming].sort((left, right) => left.name.localeCompare(right.name));
    }

    return themes
        .map((theme) => theme.id === incoming.id ? incoming : theme)
        .sort((left, right) => left.name.localeCompare(right.name));
};

export const useThemeStore = create<ThemeState>((set) => {
    const syncThemes = async (showLoading: boolean): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        if (showLoading) {
            set({ loading: true });
        }

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
            if (showLoading) {
                set({ loading: false });
            }
        }
    };

    const fetchThemes = (): Promise<void> => syncThemes(true);
    const refreshThemesInBackground = (): void => {
        syncThemes(false).catch(() => undefined);
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
                const created = await createTheme(payload);
                set((state) => ({
                    themes: upsertTheme(state.themes, created),
                    publicThemes: upsertTheme(state.publicThemes, created)
                }));
                refreshThemesInBackground();
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
                const updated = await updateTheme(id, payload);
                set((state) => ({
                    themes: upsertTheme(state.themes, updated),
                    publicThemes: upsertTheme(state.publicThemes, updated)
                }));
                refreshThemesInBackground();
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
                set((state) => ({
                    themes: state.themes.filter((theme) => theme.id !== id),
                    publicThemes: state.publicThemes.filter((theme) => theme.id !== id)
                }));
                refreshThemesInBackground();
                return true;
            } catch {
                return false;
            }
        },
        reset: () => set({ themes: [], publicThemes: [], loading: false })
    };
});
