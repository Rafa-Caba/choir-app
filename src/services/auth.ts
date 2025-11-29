import choirApi from '../api/choirApi';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// --- Standard Auth Calls ---

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    // Matches Backend: POST /api/auth/login
    const { data } = await choirApi.post<AuthResponse>('/auth/login', payload);
    return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
    // Matches Backend: POST /api/auth/register
    const { data } = await choirApi.post<AuthResponse>('/auth/register', payload);
    return data;
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
    await choirApi.post('/auth/logout', { refreshToken });
};

// --- User Profile Calls ---

export const getUserProfile = async (): Promise<User> => {
    // Matches Backend: GET /api/users/me
    const { data } = await choirApi.get<User>('/users/me');
    return data;
};

export const updatePushToken = async (token: string): Promise<void> => {
    // Matches Backend: PUT /api/users/me/push-token
    await choirApi.put('/users/me/push-token', { token });
};

export const updateTheme = async (themeId: string): Promise<User> => {
    // Matches Backend: PUT /api/users/me/theme
    const { data } = await choirApi.put<User>('/users/me/theme', { themeId });
    return data;
};

// --- Hybrid Update (Multipart) ---

export const updateProfile = async (userData: any, imageUri?: string): Promise<User> => {
    const formData = new FormData();

    // 1. Prepare JSON Data (English Keys)
    const userDTO = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        instrument: userData.instrument,
        bio: userData.bio,
        voice: userData.voice, // Boolean
        // Only send password if changed
        ...(userData.password ? { password: userData.password } : {})
    };

    formData.append('data', JSON.stringify(userDTO));

    // 2. Handle Image
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                // Backend Middleware expects field: 'file'
                formData.append('file', blob, filename);
            } catch (e) {
                console.error("Web image fetch failed", e);
            }
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        delete requestConfig.headers['Content-Type'];
    }

    // Matches Backend: PUT /api/users/me
    const { data } = await choirApi.put<User>('/users/me', formData, requestConfig);
    return data;
};