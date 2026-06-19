import { Platform } from 'react-native';
import choirApi from '../api/choirApi';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

// --- Standard Auth Calls ---

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await choirApi.post<AuthResponse>('/auth/login', payload);
    return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await choirApi.post<AuthResponse>('/auth/register', payload);
    return data;
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
    await choirApi.post('/auth/logout', { refreshToken });
};

// --- User Profile Calls ---

export const getUserProfile = async (): Promise<User> => {
    const { data } = await choirApi.get<User>('/users/me');
    return data;
};

export const updatePushToken = async (token: string): Promise<void> => {
    await choirApi.put('/users/me/push-token', { token });
};

export const updateTheme = async (themeId: string): Promise<User> => {
    const { data } = await choirApi.put<User>('/users/me/theme', { themeId });
    return data;
};

// --- Hybrid Update (Multipart) ---

export const updateProfile = async (userData: any, imageUri?: string): Promise<User> => {
    const formData = new FormData();

    const userDTO = {
        name: userData.name,
        username: userData.username,
        email: userData.email,

        // Backward compatibility
        instrument: userData.instrument,
        instrumentId: userData.instrumentId ?? undefined,
        instrumentLabel: userData.instrumentLabel ?? undefined,

        bio: userData.bio,
        voice: userData.voice,
        ...(userData.password ? { password: userData.password } : {}),
    };

    formData.append('data', JSON.stringify(userDTO));

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            // @ts-ignore
            formData.append('file', blob, filename);
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type,
            });
        }
    }

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' },
    };

    // RN-web: allow axios to set boundary
    if (Platform.OS === 'web') {
        delete requestConfig.headers['Content-Type'];
    }

    const { data } = await choirApi.put<User>('/users/me', formData, requestConfig);
    return data;
};
