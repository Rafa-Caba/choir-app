import { create } from 'zustand';
import type { Choir, CreateChoirPayload, PaginatedChoirResponse } from '../types/choir';
import { deleteChoir, getChoirById, getChoirs, saveChoir, toggleChoirActive } from '../services/choirs';

interface AdminChoirsState {
    choirs: Choir[];
    currentPage: number;
    totalPages: number;
    totalChoirs: number;

    loading: boolean;
    refreshing: boolean;

    fetchChoirs: (refresh?: boolean) => Promise<void>;
    fetchChoirById: (id: string) => Promise<Choir | null>;

    saveChoirAction: (payload: CreateChoirPayload, imageUri?: string, id?: string) => Promise<Choir>;
    toggleChoirActiveAction: (id: string, isActive: boolean) => Promise<void>;
    removeChoirAction: (id: string) => Promise<void>;

    getChoirFromState: (id: string) => Choir | undefined;
    reset: () => void;
}

export const useAdminChoirsStore = create<AdminChoirsState>((set, get) => ({
    choirs: [],
    currentPage: 1,
    totalPages: 1,
    totalChoirs: 0,

    loading: false,
    refreshing: false,

    fetchChoirs: async (refresh = false) => {
        const state = get();

        // prevent double-load
        if (state.loading) return;

        const nextPage = refresh ? 1 : state.currentPage;

        // If not refresh and already at end, stop
        if (!refresh && state.currentPage > state.totalPages) return;

        set({ loading: !refresh, refreshing: refresh });

        try {
            const data: PaginatedChoirResponse = await getChoirs(nextPage);

            set((prev) => {
                const incoming = data.choirs ?? [];

                // If refreshing, replace list
                if (refresh) {
                    return {
                        choirs: incoming,
                        currentPage: data.currentPage + 1, // next page pointer
                        totalPages: data.totalPages,
                        totalChoirs: data.totalChoirs,
                    };
                }

                // append (avoid duplicates)
                const existingIds = new Set(prev.choirs.map((c) => c.id));
                const merged = [...prev.choirs, ...incoming.filter((c) => !existingIds.has(c.id))];

                return {
                    choirs: merged,
                    currentPage: data.currentPage + 1, // next page pointer
                    totalPages: data.totalPages,
                    totalChoirs: data.totalChoirs,
                };
            });
        } catch (error) {
            console.error('Error fetching choirs:', error);
        } finally {
            set({ loading: false, refreshing: false });
        }
    },

    fetchChoirById: async (id: string) => {
        try {
            const local = get().choirs.find((c) => c.id === id);
            if (local) return local;

            const choir = await getChoirById(id);
            set((state) => ({ choirs: [...state.choirs, choir] }));
            return choir;
        } catch (error) {
            console.error('Error fetching choir:', error);
            return null;
        }
    },

    saveChoirAction: async (payload, imageUri, id) => {
        const saved = await saveChoir(payload, imageUri, id);

        set((state) => {
            const exists = state.choirs.some((c) => c.id === saved.id);
            const updated = exists
                ? state.choirs.map((c) => (c.id === saved.id ? saved : c))
                : [saved, ...state.choirs];

            return {
                choirs: updated,
                totalChoirs: exists ? state.totalChoirs : state.totalChoirs + 1,
            };
        });

        return saved;
    },

    toggleChoirActiveAction: async (id, isActive) => {
        const updated = await toggleChoirActive(id, isActive);

        set((state) => ({
            choirs: state.choirs.map((c) =>
                c.id === id ? updated : c
            ),
        }));
    },

    removeChoirAction: async (id: string) => {
        await deleteChoir(id);
        set((state) => ({
            choirs: state.choirs.filter((c) => c.id !== id),
            totalChoirs: state.totalChoirs > 0 ? state.totalChoirs - 1 : 0,
        }));
    },

    getChoirFromState: (id) => get().choirs.find((c) => c.id === id),

    reset: () =>
        set({
            choirs: [],
            currentPage: 1,
            totalPages: 1,
            totalChoirs: 0,
            loading: false,
            refreshing: false,
        }),
}));
