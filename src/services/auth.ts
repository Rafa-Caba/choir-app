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

export const updateProfile = async (data: any, imageUri?: string): Promise<User> => {
    const formData = new FormData();

    // 1. Append JSON Data
    // Spring Boot expects a Blob with type 'application/json' for the @RequestPart("data")
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    // 2. Append Image
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append('file', blob, filename);
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    // 3. Configure Headers dynamically
    const requestConfig: any = {
        headers: {
            // Default for Mobile (usually required)
            'Content-Type': 'multipart/form-data',
        }
    };

    if (Platform.OS === 'web') {
        // ⚠️ CRITICAL WEB FIX:
        // Setting Content-Type to 'undefined' removes the default 'application/json'
        // AND lets the browser automatically generate 'multipart/form-data; boundary=...'
        requestConfig.headers['Content-Type'] = undefined;
    }

    const { data: responseData } = await choirApi.put<User>('/users/me', formData, requestConfig);
    
    return responseData;
};

export const updatePushToken = async (token: string): Promise<void> => {
    await choirApi.put('/users/me/push-token', { token });
};