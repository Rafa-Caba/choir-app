import { Platform } from 'react-native';
import choirApi from '../api/choirApi';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await choirApi.post<AuthResponse>('/auth/login', payload);
    return data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await choirApi.post<AuthResponse>('/auth/register', payload);
    return data;
};

// Assuming you created a GET /api/users/me endpoint in Spring Boot
export const getUserProfile = async (): Promise<User> => {
    const { data } = await choirApi.get<User>('/users/me');
    return data;
};

export const updateProfile = async (userData: any, imageUri?: string) => {
    const formData = new FormData();

    // 1. Backend expects 'data' part as String
    formData.append('data', JSON.stringify(userData));

    // 2. Handle Image
    if (imageUri) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const type = 'image/jpeg';
        
        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
            name: filename,
            type: type,
        });
    }

    // 3. Send as Multipart
    const { data } = await choirApi.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updatePushToken = async (token: string): Promise<void> => {
    await choirApi.put('/users/me/push-token', { token });
};