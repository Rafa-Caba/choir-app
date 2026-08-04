// src/store/useAdminUsersStore.ts

import { create } from 'zustand';
import {
    deleteUser,
    getAllUsers,
    resetUserPassword,
    saveUser,
    setUserActiveStatus,
    type AdminUserInput,
    type SaveUserResult
} from '../services/admin/users';
import { getApiErrorMessage } from '../services/auth';
import type { User } from '../types/auth';

interface AdminUsersState {
    readonly users: readonly User[];
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly errorMessage: string | null;
    readonly page: number;
    readonly hasMore: boolean;
    fetchUsers: (refresh?: boolean) => Promise<void>;
    saveUserAction: (data: AdminUserInput, imageUri?: string, id?: string) => Promise<SaveUserResult | null>;
    setUserActiveAction: (id: string, isActive: boolean) => Promise<boolean>;
    resetPasswordAction: (id: string) => Promise<string | null>;
    removeUserAction: (id: string) => Promise<boolean>;
    reset: () => void;
}

const initialState = {
    users: [] as readonly User[],
    loading: false,
    refreshing: false,
    errorMessage: null,
    page: 0,
    hasMore: true
};

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
    ...initialState,

    fetchUsers: async (refresh = false) => {
        const state = get();

        if (state.loading || state.refreshing || (!refresh && !state.hasMore)) {
            return;
        }

        const nextPage = refresh ? 1 : state.page + 1;
        set({ loading: !refresh, refreshing: refresh, errorMessage: null });

        try {
            const response = await getAllUsers(nextPage, 10);
            set((current) => ({
                users: refresh
                    ? response.users
                    : [
                        ...current.users,
                        ...response.users.filter(
                            (incoming) => !current.users.some((existing) => existing.id === incoming.id)
                        )
                    ],
                page: response.currentPage,
                hasMore: response.currentPage < response.totalPages
            }));
        } finally {
            set({ loading: false, refreshing: false });
        }
    },

    saveUserAction: async (data, imageUri, id) => {
        set({ loading: true, errorMessage: null });

        try {
            const result = await saveUser(data, imageUri, id);
            const saved = result.user;
            set((state) => {
                const exists = state.users.some((user) => user.id === saved.id);
                return {
                    users: exists
                        ? state.users.map((user) => user.id === saved.id ? saved : user)
                        : [saved, ...state.users]
                };
            });
            return result;
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    setUserActiveAction: async (id, isActive) => {
        try {
            const updated = await setUserActiveStatus(id, isActive);
            set((state) => ({
                users: state.users.map((user) => user.id === id ? updated : user)
            }));
            return true;
        } catch {
            return false;
        }
    },

    resetPasswordAction: async (id) => {
        try {
            return (await resetUserPassword(id)).temporaryPassword;
        } catch {
            return null;
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

    reset: () => set(initialState)
}));
