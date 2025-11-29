import choirApi from '../../api/choirApi';
import type { User } from '../../types/auth';
import { Platform } from 'react-native';

// Helper: Async FormData Builder
const createFormData = async (userData: any, imageUri?: string) => {
    const formData = new FormData();

    // 1. Map UI fields to English Backend Fields
    let safeRole = 'VIEWER';
    if (userData.role) {
        safeRole = userData.role.toUpperCase(); // Backend uses uppercase Enum
    }

    const userDTO = {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: safeRole,
        instrument: userData.instrument,
        bio: userData.bio,
        voice: userData.voice,
        // Send password only if provided
        ...(userData.password ? { password: userData.password } : {})
    };

    formData.append('data', JSON.stringify(userDTO));

    // 2. Append Image
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = 'profile.jpg';
        const type = 'image/jpeg';

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                // Backend expects 'file'
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

    return formData;
};

// GET ALL (Paginated)
export const getAllUsers = async (page = 1, limit = 10): Promise<{ users: User[], totalPages: number }> => {
    // Backend returns { users: [], totalPages: number, ... }
    const { data } = await choirApi.get<any>(`/users?page=${page}&limit=${limit}`);
    return {
        users: data.users || [],
        totalPages: data.totalPages || 1
    };
};

// SAVE (Create/Update)
export const saveUser = async (userData: any, imageUri?: string, userId?: string): Promise<User> => {
    const formData = await createFormData(userData, imageUri);

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        delete requestConfig.headers['Content-Type'];
    }

    if (userId) {
        // UPDATE
        const { data } = await choirApi.put<{ user: User }>(`/users/${userId}`, formData, requestConfig);
        // Backend response structure might be { message, user } or direct user. Adjust if needed.
        return (data as any).updatedUser || data;
    } else {
        // CREATE
        const { data } = await choirApi.post<{ user: User }>(`/users`, formData, requestConfig);
        return (data as any).user || data;
    }
};

// DELETE
export const deleteUser = async (id: string): Promise<void> => {
    await choirApi.delete(`/users/${id}`);
};