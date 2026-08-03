// src/store/useAdminUsersStore.ts

import { create } from 'zustand';
import {
    deleteUser,
    getAllUsers,
    saveUser,
    type AdminUserInput
} from '../services/admin/users';
import type { User } from '../types/auth';

interface AdminUsersState {
    users: User[];
    loading: boolean;
    refreshing: boolean;
    page: number;
    hasMore: boolean;
    fetchUsers: (refresh?: boolean) => Promise<void>;
    saveUserAction: (data: AdminUserInput, imageUri?: string, id?: string) => Promise<boolean>;
    removeUserAction: (id: string) => Promise<boolean>;
    reset: () => void;
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
    users: [],
    loading: false,
    refreshing: false,
    page: 0,
    hasMore: true,

    fetchUsers: async (refresh = false) => {
        const state = get();
        if (state.loading || (!refresh && !state.hasMore)) return;

        const nextPage = refresh ? 1 : state.page + 1;
        set({ loading: !refresh, refreshing: refresh });

        try {
            const response = await getAllUsers(nextPage, 10);
            set((current) => ({
                users: refresh
                    ? [...response.users]
                    : [...current.users, ...response.users.filter(
                        (incoming) => !current.users.some((existing) => existing.id === incoming.id)
                    )],
                page: response.currentPage,
                hasMore: response.currentPage < response.totalPages
            }));
        } finally {
            set({ loading: false, refreshing: false });
        }
    },

    saveUserAction: async (data, imageUri, id) => {
        set({ loading: true });
        try {
            await saveUser(data, imageUri, id);
            await get().fetchUsers(true);
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeUserAction: async (id) => {
        try {
            await deleteUser(id);
            set((state) => ({ users: state.users.filter((user) => user.id !== id) }));
            return true;
        } catch {
            return false;
        }
    },

    reset: () => set({
        users: [],
        loading: false,
        refreshing: false,
        page: 0,
        hasMore: true
    })
}));
