import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    loginUser,
    registerUser,
    getUserProfile,
    updateProfile,
    logoutUser
} from '../services/auth';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    status: 'checking' | 'authenticated' | 'unauthenticated';
    loading: boolean;
    errorMessage: string | null;

    login: (payload: LoginPayload) => Promise<boolean>;
    register: (payload: RegisterPayload) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;

    updateUserProfile: (data: any, imageUri?: string) => Promise<boolean>;
    setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,
            status: 'checking',
            loading: false,
            errorMessage: null,

            login: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const response = await loginUser(payload);
                    set({
                        token: response.accessToken,
                        refreshToken: response.refreshToken,
                        user: response.user,
                        status: 'authenticated',
                        loading: false
                    });
                    return true;
                } catch (error: any) {
                    set({
                        loading: false,
                        status: 'unauthenticated',
                        errorMessage: error.response?.data?.message || 'Login failed'
                    });
                    return false;
                }
            },

            register: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const response = await registerUser(payload);
                    set({
                        token: response.accessToken,
                        refreshToken: response.refreshToken,
                        user: response.user,
                        status: 'authenticated',
                        loading: false
                    });
                    return true;
                } catch (error: any) {
                    set({
                        loading: false,
                        errorMessage: error.response?.data?.message || 'Registration failed'
                    });
                    return false;
                }
            },

            logout: async () => {
                const { refreshToken } = get();
                if (refreshToken) {
                    try { await logoutUser(refreshToken); } catch (e) { console.log("Logout API failed", e); }
                }
                set({ token: null, refreshToken: null, user: null, status: 'unauthenticated' });
                await AsyncStorage.removeItem('auth-storage');
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) {
                    set({ status: 'unauthenticated' });
                    return;
                }
                try {
                    const user = await getUserProfile();
                    set({ user, status: 'authenticated' });
                } catch (error) {
                    console.log("CheckAuth: Token invalid or expired");
                    set({ status: 'unauthenticated', token: null, refreshToken: null, user: null });
                }
            },

            clearError: () => set({ errorMessage: null }),

            updateUserProfile: async (data, imageUri) => {
                set({ loading: true });
                try {
                    const updatedUser = await updateProfile(data, imageUri);
                    set({ user: updatedUser, loading: false });
                    return true;
                } catch (error) {
                    console.error(error);
                    set({ loading: false });
                    return false;
                }
            },

            setAccessToken: (newToken: string) => {
                set({ token: newToken });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);