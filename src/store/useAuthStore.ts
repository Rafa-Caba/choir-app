import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserProfile, updateProfile } from '../services/auth';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    status: 'checking' | 'authenticated' | 'not-authenticated';
    errorMessage: string | null;
    loading: boolean;

    login: (payload: LoginPayload) => Promise<boolean>;
    register: (payload: RegisterPayload) => Promise<boolean>;
    updateUserProfile: (data: any, imageUri?: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,
            status: 'checking',
            errorMessage: null,
            loading: false,

            login: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const { accessToken, refreshToken } = await loginUser(payload);
                    
                    // 1. Set tokens immediately so interceptors can use them
                    set({ token: accessToken, refreshToken: refreshToken });

                    // 2. Get Profile
                    const user = await getUserProfile();

                    set({ 
                        status: 'authenticated', 
                        user: user,
                        loading: false 
                    });
                    return true;

                } catch (error: any) {
                    console.log(error.response?.data);
                    set({ 
                        status: 'not-authenticated', 
                        token: null, 
                        refreshToken: null,
                        user: null,
                        errorMessage: 'Credenciales incorrectas',
                        loading: false 
                    });
                    return false;
                }
            },

            register: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const { accessToken, refreshToken } = await registerUser(payload);
                    
                    set({ token: accessToken, refreshToken: refreshToken });

                    const user = await getUserProfile();

                    set({ 
                        status: 'authenticated', 
                        user: user, 
                        loading: false 
                    });
                    return true;
                } catch (error: any) {
                    set({ 
                        status: 'not-authenticated', 
                        errorMessage: error.response?.data?.message || 'Error al registrarse',
                        loading: false 
                    });
                    return false;
                }
            },

            updateUserProfile: async (data: any, imageUri?: string) => {
                set({ loading: true });
                try {
                    // Calls the service which handles FormData/Multipart
                    const updatedUser = await updateProfile(data, imageUri);
                    
                    // Update state (Persist middleware handles saving to disk)
                    set({ user: updatedUser });
                    return true;
                } catch (error) {
                    console.error("Update Profile Error", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            logout: () => {
                set({ 
                    status: 'not-authenticated', 
                    token: null, 
                    refreshToken: null, 
                    user: null 
                });
            },

            checkAuth: async () => {
                const token = get().token;

                if (!token) {
                    set({ status: 'not-authenticated' });
                    return;
                }

                try {
                    // Verify token with backend
                    const user = await getUserProfile();
                    set({ status: 'authenticated', user });
                } catch (error: any) {                    
                    // If it's a 401/403, the token is invalid -> Logout
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        set({ status: 'not-authenticated', token: null, user: null });
                    } else {
                        // If it's a Network Error (Offline), keep the user logged in
                        // The app will run using cached data from other stores
                        console.log("Offline or Server Error: Keeping session alive");
                        set({ status: 'authenticated' });
                    }
                }
            },

            clearError: () => set({ errorMessage: null }),
            
            // Helper to manually update user state from other components if needed
            setUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                token: state.token, 
                refreshToken: state.refreshToken,
                user: state.user,
                status: state.status 
            }),
        }
    )
);