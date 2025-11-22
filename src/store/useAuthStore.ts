import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserProfile, updateProfile } from '../services/auth';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';

interface AuthState {
    token: string | null;
    user: User | null;
    status: 'checking' | 'authenticated' | 'not-authenticated';
    errorMessage: string | null;
    loading: boolean;

    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    updateUserProfile: (data: any, imageUri?: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            status: 'checking',
            errorMessage: null,
            loading: false,

            login: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const { accessToken, refreshToken } = await loginUser(payload);
                    
                    // Save tokens
                    await AsyncStorage.setItem('token', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);

                    // Get Profile
                    // We need to set the token in state temporarily so the interceptor picks it up
                    // or we can rely on AsyncStorage being set above.
                    
                    // Small delay to ensure AsyncStorage is ready for the interceptor
                    // Or better, pass the token directly to a service if needed. 
                    // But our interceptor reads from AsyncStorage, so we are good.
                    
                    const user = await getUserProfile();

                    set({ 
                        status: 'authenticated', 
                        token: accessToken, 
                        user: user,
                        loading: false 
                    });

                } catch (error: any) {
                    console.log(error.response?.data);
                    set({ 
                        status: 'not-authenticated', 
                        token: null, 
                        user: null,
                        errorMessage: 'Credenciales incorrectas', // Spanish UI
                        loading: false 
                    });
                }
            },

            register: async (payload) => {
                set({ loading: true, errorMessage: null });
                try {
                    const { accessToken, refreshToken } = await registerUser(payload);
                    
                    await AsyncStorage.setItem('token', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);

                    const user = await getUserProfile();

                    set({ 
                        status: 'authenticated', 
                        token: accessToken, 
                        user: user, 
                        loading: false 
                    });
                } catch (error: any) {
                    set({ 
                        status: 'not-authenticated', 
                        errorMessage: error.response?.data?.message || 'Error al registrarse',
                        loading: false 
                    });
                }
            },

            updateUserProfile: async (data: any, imageUri?: string) => {
                set({ loading: true });
                try {
                    // Pass imageUri to service
                    const updatedUser = await updateProfile(data, imageUri);
                    
                    set({ user: updatedUser });
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    return true;
                } catch (error) {
                    console.error(error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            logout: async () => {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('refreshToken');
                set({ status: 'not-authenticated', token: null, user: null });
            },

            checkAuth: async () => {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    set({ status: 'not-authenticated', token: null });
                    return;
                }

                try {
                    // Verify token is still valid by fetching profile
                    const user = await getUserProfile();
                    set({ status: 'authenticated', token, user });
                } catch (error) {
                    // Token expired or invalid
                    await AsyncStorage.removeItem('token');
                    set({ status: 'not-authenticated', token: null });
                }
            },

            clearError: () => set({ errorMessage: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage), // Required for React Native
            partialize: (state) => ({ token: state.token, user: state.user }), // Persist these fields
        }
    )
);