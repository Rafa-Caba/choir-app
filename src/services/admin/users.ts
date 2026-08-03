// src/services/admin/users.ts

import choirApi from '../../api/choirApi';
import type { User } from '../../types/auth';
import { appendLocalFile, getMultipartRequestConfig } from '../multipart';

export type TenantManagedRole = 'VIEWER' | 'USER' | 'EDITOR' | 'ADMIN';

export interface AdminUserInput {
    readonly name: string;
    readonly username: string;
    readonly email: string;
    readonly role: TenantManagedRole;
    readonly password?: string;
    readonly instrument?: string;
    readonly instrumentId?: string | null;
    readonly instrumentLabel?: string;
    readonly bio?: string;
    readonly voice?: boolean;
}

interface PaginatedUsersResponse {
    readonly users: readonly User[];
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalUsers: number;
}

export const getAllUsers = async (
    page = 1,
    limit = 10
): Promise<PaginatedUsersResponse> => {
    const response = await choirApi.get<PaginatedUsersResponse>('/users', {
        params: { page, limit }
    });
    return response.data;
};

export const getUserDirectory = async (): Promise<readonly User[]> => {
    const response = await choirApi.get<readonly User[]>('/users/directory');
    return response.data;
};

export const saveUser = async (
    userData: AdminUserInput,
    imageUri?: string,
    userId?: string
): Promise<void> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        temporaryPassword: userData.password || undefined,
        instrument: userData.instrument,
        instrumentId: userData.instrumentId,
        instrumentLabel: userData.instrumentLabel,
        bio: userData.bio,
        voice: userData.voice
    }));

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() ?? 'profile.jpg';
        await appendLocalFile(formData, 'file', {
            uri: imageUri,
            filename,
            mimeType: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
        });
    }

    if (userId) {
        await choirApi.put(`/users/${userId}`, formData, getMultipartRequestConfig());
    } else {
        await choirApi.post('/users', formData, getMultipartRequestConfig());
    }
};

export const deleteUser = async (id: string): Promise<void> => {
    await choirApi.delete(`/users/${id}`);
};
