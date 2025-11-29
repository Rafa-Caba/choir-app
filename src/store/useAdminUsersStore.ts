import { create } from 'zustand';
import { getAllUsers, saveUser, deleteUser } from '../services/admin/users';
import type { User } from '../types/auth';

interface AdminUsersState {
    users: User[];
    loading: boolean;
    refreshing: boolean;
    page: number;
    hasMore: boolean;

    fetchUsers: (refresh?: boolean) => Promise<void>;
    saveUserAction: (data: any, imageUri?: string, id?: string) => Promise<boolean>;
    removeUserAction: (id: string) => Promise<boolean>;
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
    users: [],
    loading: false,
    refreshing: false,
    page: 1,
    hasMore: true,

    fetchUsers: async (refresh = false) => {
        const { page, users, loading, hasMore } = get();

        if (loading) return;
        if (!refresh && !hasMore) return;

        // Show full spinner on first load, small spinner on refresh
        if (refresh && users.length === 0) {
            set({ loading: true, refreshing: false });
        } else if (refresh) {
            set({ refreshing: true, loading: false });
        } else {
            set({ loading: true, refreshing: false });
        }

        try {
            const nextPage = refresh ? 1 : page + 1;
            const limit = 10;

            // 🛠️ FIX: Destructure English keys from Service
            const { users: newUsers, totalPages } = await getAllUsers(nextPage, limit);

            set({
                users: refresh ? newUsers : [...users, ...newUsers],
                page: nextPage,
                hasMore: nextPage < totalPages,
            });
        } catch (e) {
            console.error("Fetch Users Failed:", e);
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
        } catch (e) {
            console.error("Save User Failed:", e);
            return false;
        } finally {
            set({ loading: false });
        }
    },

    removeUserAction: async (id) => {
        try {
            await deleteUser(id);
            set(state => ({ users: state.users.filter(u => u.id !== id) }));
            return true;
        } catch (e) { return false; }
    }
}));