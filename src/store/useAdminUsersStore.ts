import { create } from 'zustand';
import { getAllUsers, saveUser, deleteUser } from '../services/admin/users';
import type { User } from '../types/auth';

interface AdminUsersState {
    users: User[];
    loading: boolean;
    fetchUsers: () => Promise<void>;
    saveUserAction: (data: any, imageUri?: string, id?: number) => Promise<boolean>;
    removeUserAction: (id: number) => Promise<boolean>;
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
    users: [],
    loading: false,

    fetchUsers: async () => {
        set({ loading: true });
        try {
            const data = await getAllUsers();
            set({ users: data });
        } catch (e) {
            console.error(e);
        } finally {
            set({ loading: false });
        }
    },

    saveUserAction: async (data, imageUri, id) => {
        set({ loading: true });
        try {
            await saveUser(data, imageUri, id);
            await get().fetchUsers(); // Refresh list
            return true;
        } catch (e) {
            console.error(e);
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
        } catch (e) {
            return false;
        }
    }
}));