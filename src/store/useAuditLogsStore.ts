// src/store/useAuditLogsStore.ts

import { create } from 'zustand';
import { getAuditLogs } from '../services/audit';
import type { AuditLogEntry, AuditScope } from '../types/audit';

interface AuditLogsState {
    readonly logs: readonly AuditLogEntry[];
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly page: number;
    readonly totalPages: number;
    readonly totalLogs: number;
    readonly errorMessage: string | null;
    fetchLogs: (scope: AuditScope, choirId?: string, refresh?: boolean) => Promise<void>;
    reset: () => void;
}

const initialState = {
    logs: [] as readonly AuditLogEntry[],
    loading: false,
    refreshing: false,
    page: 0,
    totalPages: 1,
    totalLogs: 0,
    errorMessage: null as string | null
};

export const useAuditLogsStore = create<AuditLogsState>((set, get) => ({
    ...initialState,

    fetchLogs: async (scope, choirId, refresh = false) => {
        const current = get();

        if (current.loading || current.refreshing) {
            return;
        }

        if (!refresh && current.page >= current.totalPages) {
            return;
        }

        const nextPage = refresh ? 1 : current.page + 1;
        set({
            loading: !refresh,
            refreshing: refresh,
            errorMessage: null
        });

        try {
            const response = await getAuditLogs({
                scope,
                page: nextPage,
                choirId
            });

            set((state) => {
                const incoming = response.logs;
                const existingIds = new Set(state.logs.map((log) => log.id));
                const merged = refresh
                    ? incoming
                    : [...state.logs, ...incoming.filter((log) => !existingIds.has(log.id))];

                return {
                    logs: merged,
                    page: response.currentPage,
                    totalPages: Math.max(1, response.totalPages),
                    totalLogs: response.totalLogs
                };
            });
        } catch (error) {
            set({
                errorMessage: error instanceof Error
                    ? error.message
                    : 'No fue posible cargar la auditoría'
            });
        } finally {
            set({ loading: false, refreshing: false });
        }
    },

    reset: () => set(initialState)
}));
