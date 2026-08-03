// src/store/useAdminChoirsStore.ts

import { create } from 'zustand';
import {
    deleteChoir,
    getChoirById,
    getChoirs,
    saveChoir,
    toggleChoirActive
} from '../services/choirs';
import type { Choir, CreateChoirPayload } from '../types/choir';

interface AdminChoirsState {
    readonly choirs: readonly Choir[];
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalChoirs: number;
    readonly loading: boolean;
    readonly refreshing: boolean;
    fetchChoirs: (refresh?: boolean) => Promise<void>;
    fetchChoirById: (id: string) => Promise<Choir | null>;
    saveChoirAction: (payload: CreateChoirPayload, imageUri?: string, id?: string) => Promise<Choir>;
    toggleChoirActiveAction: (id: string, isActive: boolean) => Promise<void>;
    removeChoirAction: (id: string) => Promise<void>;
    getChoirFromState: (id: string) => Choir | undefined;
    reset: () => void;
}

const initialState = {
    choirs: [] as readonly Choir[],
    currentPage: 0,
    totalPages: 1,
    totalChoirs: 0,
    loading: false,
    refreshing: false
};

export const useAdminChoirsStore = create<AdminChoirsState>((set, get) => ({
    ...initialState,

    fetchChoirs: async (refresh = false) => {
        const state = get();

        if (state.loading || state.refreshing) {
            return;
        }

        if (!refresh && state.currentPage >= state.totalPages) {
            return;
        }

        const nextPage = refresh ? 1 : state.currentPage + 1;
        set({ loading: !refresh, refreshing: refresh });

        try {
            const data = await getChoirs(nextPage);
            set((current) => {
                const existingIds = new Set(current.choirs.map((choir) => choir.id));
                return {
                    choirs: refresh
                        ? data.choirs
                        : [
                            ...current.choirs,
                            ...data.choirs.filter((choir) => !existingIds.has(choir.id))
                        ],
                    currentPage: data.currentPage,
                    totalPages: Math.max(1, data.totalPages),
                    totalChoirs: data.totalChoirs
                };
            });
        } finally {
            set({ loading: false, refreshing: false });
        }
    },

    fetchChoirById: async (id) => {
        const local = get().choirs.find((choir) => choir.id === id);

        if (local) {
            return local;
        }

        try {
            const choir = await getChoirById(id);
            set((state) => ({ choirs: [...state.choirs, choir] }));
            return choir;
        } catch {
            return null;
        }
    },

    saveChoirAction: async (payload, imageUri, id) => {
        const saved = await saveChoir(payload, imageUri, id);
        set((state) => {
            const exists = state.choirs.some((choir) => choir.id === saved.id);
            return {
                choirs: exists
                    ? state.choirs.map((choir) => choir.id === saved.id ? saved : choir)
                    : [saved, ...state.choirs],
                totalChoirs: exists ? state.totalChoirs : state.totalChoirs + 1
            };
        });
        return saved;
    },

    toggleChoirActiveAction: async (id, isActive) => {
        const updated = await toggleChoirActive(id, isActive);
        set((state) => ({
            choirs: state.choirs.map((choir) => choir.id === id ? updated : choir)
        }));
    },

    removeChoirAction: async (id) => {
        await deleteChoir(id);
        set((state) => ({
            choirs: state.choirs.map((choir) => choir.id === id
                ? { ...choir, isActive: false }
                : choir)
        }));
    },

    getChoirFromState: (id) => get().choirs.find((choir) => choir.id === id),
    reset: () => set(initialState)
}));
