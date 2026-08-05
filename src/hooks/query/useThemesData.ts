// src/hooks/query/useThemesData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createTheme,
    deleteTheme,
    getAllThemes,
    updateTheme
} from '../../services/theme';
import type { CreateThemePayload, Theme } from '../../types/theme';
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useTenantQueryScope } from './useTenantQueryScope';

interface UpdateThemeVariables {
    readonly id: string;
    readonly payload: Partial<CreateThemePayload>;
}

const sortThemes = (themes: readonly Theme[]): readonly Theme[] =>
    [...themes].sort((left, right) => left.name.localeCompare(right.name));

export const useThemesQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.themes(scope.tenantKey),
        queryFn: getAllThemes,
        enabled: scope.enabled,
        staleTime: 5 * 60_000,
        select: sortThemes
    });
};

export const useCreateThemeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: createTheme,
        onSuccess: (created) => {
            queryClient.setQueryData<readonly Theme[]>(
                queryKeys.themes(scope.tenantKey),
                (current) => sortThemes(upsertById(current, created, 'end'))
            );
        }
    });
};

export const useUpdateThemeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, payload }: UpdateThemeVariables) => updateTheme(id, payload),
        onSuccess: (updated) => {
            queryClient.setQueryData<readonly Theme[]>(
                queryKeys.themes(scope.tenantKey),
                (current) => sortThemes(upsertById(current, updated, 'end'))
            );
        }
    });
};

export const useDeleteThemeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: deleteTheme,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly Theme[]>(
                queryKeys.themes(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};
