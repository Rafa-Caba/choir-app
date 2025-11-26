import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserProfile, updateProfile } from '../services/auth';
import type { LoginPayload, RegisterPayload, User } from '../types/auth';
import choirApi from '../api/choirApi'; // <--- Import API instance

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
                    
                    // Persist to Storage (Async)
                    await AsyncStorage.setItem('token', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);

                    // Manually inject token into Axios instance immediately
                    choirApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                    // Update State (Sync)
                    set({ token: accessToken, refreshToken: refreshToken });

                    // Get Profile (Now safe to call)
                    const user = await getUserProfile();

                    set({ 
                        status: 'authenticated', 
                        user: user,
                        loading: false 
                    });
                    return true;

                } catch (error: any) {
                    console.log("Login Error:", error.response?.data || error.message);
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
                    
                    // Persist
                    await AsyncStorage.setItem('token', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);

                    // Inject Header
                    choirApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                    // Update State
                    set({ token: accessToken, refreshToken: refreshToken });

                    // Get Profile
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
                    
                    // Update state immediately
                    set({ user: updatedUser });
                    return true;
                } catch (error) {
                    console.error("Update Profile Error", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            logout: async () => {
                // Clear headers
                delete choirApi.defaults.headers.common['Authorization'];
                
                // Clear storage
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('refreshToken');
                
                // Clear state
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

                // Ensure header is set if restoring from disk
                choirApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    // Verify token with backend
                    const user = await getUserProfile();
                    set({ status: 'authenticated', user });
                } catch (error: any) {                    
                    // If 401/403, token is invalid -> Logout
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        await AsyncStorage.removeItem('token');
                        delete choirApi.defaults.headers.common['Authorization'];
                        set({ status: 'not-authenticated', token: null, user: null });
                    } else {
                        // If Network Error (Offline), keep session alive
                        console.log("Offline or Server Error: Keeping session alive");
                        set({ status: 'authenticated' });
                    }
                }
            },

            clearError: () => set({ errorMessage: null }),
            
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