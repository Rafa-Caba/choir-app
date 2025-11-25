import choirApi from '../../api/choirApi';
import type { User } from '../../types/auth';
import { Platform } from 'react-native';

// --- Helper: Async FormData Builder ---
const createFormData = async (userData: any, imageUri?: string) => {
    const formData = new FormData();

    const userDTO = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        instrument: userData.instrument,
        bio: userData.bio,
        ...(userData.password ? { password: userData.password } : {})
    };

    // 1. Append JSON
    formData.append('user', JSON.stringify(userDTO));

    // 2. Append Image (skip if remote URL)
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'p.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('image', blob, filename);
            } catch (e) {
                console.error("Web image fetch failed", e);
            }
        } else {
            // @ts-ignore
            formData.append('image', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    return formData;
};

export const getAllUsers = async (): Promise<User[]> => {
    const { data } = await choirApi.get<User[]>('/users');
    return data;
};

export const saveUser = async (userData: any, imageUri?: string, userId?: number): Promise<User> => {
    const formData = await createFormData(userData, imageUri);

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        requestConfig.headers['Content-Type'] = undefined;
    }

    if (userId) {
        const { data } = await choirApi.put<User>(`/users/${userId}`, formData, requestConfig);
        return data;
    } else {
        const { data } = await choirApi.post<User>('/users', formData, requestConfig);
        return data;
    }
};

export const deleteUser = async (id: number): Promise<void> => {
    await choirApi.delete(`/users/${id}`);
};