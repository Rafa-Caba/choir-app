// src/store/useThemeStore.ts

import { create } from 'zustand';
import {
    createTheme,
    deleteTheme,
    getAllThemes,
    updateTheme
} from '../services/theme';
import type { CreateThemePayload, Theme } from '../types/theme';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { removeById, upsertById } from '../query/cacheUpdates';

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

const sortThemes = (themes: readonly Theme[]): Theme[] =>
    [...themes].sort((left, right) => left.name.localeCompare(right.name));

export const useThemeStore = create<ThemeState>((set) => {
    const publish = (themes: readonly Theme[]): void => {
        const sorted = sortThemes(themes);
        set({ themes: sorted, publicThemes: sorted });
    };

    const fetchThemes = async (): Promise<void> => {
        const scope = getTenantQueryScopeSnapshot();

        if (!scope.enabled) {
            return;
        }

        set({ loading: true });
        try {
            const themes = await queryClient.fetchQuery({
                queryKey: queryKeys.themes(scope.tenantKey),
                queryFn: getAllThemes,
                staleTime: 5 * 60_000
            });
            publish(themes);
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
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });

            try {
                const created = await createTheme(payload);
                const updated = sortThemes(upsertById(
                    queryClient.getQueryData<readonly Theme[]>(queryKeys.themes(scope.tenantKey)),
                    created,
                    'end'
                ));
                queryClient.setQueryData(queryKeys.themes(scope.tenantKey), updated);
                publish(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        editTheme: async (id, payload) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });

            try {
                const updatedTheme = await updateTheme(id, payload);
                const updated = sortThemes(upsertById(
                    queryClient.getQueryData<readonly Theme[]>(queryKeys.themes(scope.tenantKey)),
                    updatedTheme,
                    'end'
                ));
                queryClient.setQueryData(queryKeys.themes(scope.tenantKey), updated);
                publish(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        removeTheme: async (id) => {
            const scope = getTenantQueryScopeSnapshot();
            set({ loading: true });

            try {
                await deleteTheme(id);
                const updated = sortThemes(removeById(
                    queryClient.getQueryData<readonly Theme[]>(queryKeys.themes(scope.tenantKey)),
                    id
                ));
                queryClient.setQueryData(queryKeys.themes(scope.tenantKey), updated);
                publish(updated);
                return true;
            } catch {
                return false;
            } finally {
                set({ loading: false });
            }
        },
        reset: () => set({ themes: [], publicThemes: [], loading: false })
    };
});
