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

interface UserResponse {
    readonly user: User;
    readonly temporaryPassword?: string;
}

export interface SaveUserResult {
    readonly user: User;
    readonly temporaryPassword: string | null;
}

export interface PasswordResetResponse {
    readonly message: string;
    readonly temporaryPassword: string;
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
    const response = await choirApi.get<{ readonly users: readonly User[] }>('/users/directory');
    return response.data.users;
};

export const saveUser = async (
    userData: AdminUserInput,
    imageUri?: string,
    userId?: string
): Promise<SaveUserResult> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        temporaryPassword: userData.password || undefined,
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

    const response = userId
        ? await choirApi.put<UserResponse>(`/users/${userId}`, formData, getMultipartRequestConfig())
        : await choirApi.post<UserResponse>('/users', formData, getMultipartRequestConfig());

    return {
        user: response.data.user,
        temporaryPassword: response.data.temporaryPassword ?? null
    };
};

export const setUserActiveStatus = async (
    id: string,
    isActive: boolean
): Promise<User> => {
    const response = await choirApi.patch<UserResponse>(`/users/${id}/status`, { isActive });
    return response.data.user;
};

export const resetUserPassword = async (
    id: string,
    temporaryPassword?: string
): Promise<PasswordResetResponse> => {
    const response = await choirApi.post<PasswordResetResponse>(
        `/users/${id}/reset-password`,
        temporaryPassword ? { temporaryPassword } : {}
    );
    return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await choirApi.delete(`/users/${id}`);
};
