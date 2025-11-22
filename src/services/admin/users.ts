import choirApi from '../../api/choirApi';
import type { User } from '../../types/auth';
import { Platform } from 'react-native';

export const getAllUsers = async (): Promise<User[]> => {
    const { data } = await choirApi.get<User[]>('/users');
    return data;
};

// Combined Create/Update function for simplicity
export const saveUser = async (userData: any, imageUri?: string, userId?: number): Promise<User> => {
    const formData = new FormData();

    // Build JSON part
    const userDTO = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        instrument: userData.instrument,
        bio: userData.bio,
        // Add password if exists
        ...(userData.password ? { password: userData.password } : {})
    };

    formData.append('user', new Blob([JSON.stringify(userDTO)], { type: 'application/json' }));

    // Build Image part with Web Fix
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'p.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append('image', blob, filename);
        } else {
            // @ts-ignore
            formData.append('image', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    // --- HEADER FIX ---
    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        requestConfig.headers['Content-Type'] = undefined;
    }
    // ------------------

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