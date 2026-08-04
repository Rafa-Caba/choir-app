// src/services/auth.ts

import axios from 'axios';
import choirApi, {
    API_BASE_URL,
    API_REQUEST_TIMEOUT_MS
} from '../api/choirApi';
import {
    appendLocalFile,
    createLocalUpload,
    getMultipartRequestConfig
} from './multipart';
import type {
    AuthSessionResponse,
    ChangePasswordPayload,
    CurrentSessionResponse,
    LogoutPayload,
    PlatformLoginPayload,
    TenantLoginPayload,
    UpdateProfileInput,
    User,
    UserResponse
} from '../types/auth';

export const loginTenant = async (
    payload: TenantLoginPayload
): Promise<AuthSessionResponse> => {
    const response = await choirApi.post<AuthSessionResponse>('/auth/login', payload);
    return response.data;
};

export const loginPlatform = async (
    payload: PlatformLoginPayload
): Promise<AuthSessionResponse> => {
    const response = await choirApi.post<AuthSessionResponse>('/auth/platform-login', payload);
    return response.data;
};

export const getCurrentSession = async (): Promise<CurrentSessionResponse> => {
    const response = await choirApi.get<CurrentSessionResponse>('/auth/me');
    return response.data;
};

export const changePassword = async (
    payload: ChangePasswordPayload
): Promise<AuthSessionResponse> => {
    const response = await choirApi.post<AuthSessionResponse>('/auth/change-password', payload);
    return response.data;
};

interface LogoutSessionInput extends LogoutPayload {
    readonly accessToken: string;
}

const submitLogout = async (
    accessToken: string,
    payload: LogoutPayload
): Promise<void> => {
    await axios.post(
        `${API_BASE_URL}/auth/logout`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            timeout: API_REQUEST_TIMEOUT_MS
        }
    );
};

export const logoutUser = async (input: LogoutSessionInput): Promise<void> => {
    const payload: LogoutPayload = {
        refreshToken: input.refreshToken,
        deviceId: input.deviceId
    };

    try {
        await submitLogout(input.accessToken, payload);
    } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
            throw error;
        }

        const refreshed = await axios.post<AuthSessionResponse>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken: input.refreshToken },
            { timeout: API_REQUEST_TIMEOUT_MS }
        );
        await submitLogout(refreshed.data.accessToken, {
            refreshToken: refreshed.data.refreshToken,
            deviceId: input.deviceId
        });
    }
};

export const getUserProfile = async (): Promise<User> => {
    const response = await choirApi.get<UserResponse>('/users/me');
    return response.data.user;
};

export const updateTheme = async (themeId: string): Promise<User> => {
    const response = await choirApi.put<UserResponse>('/users/me/theme', { themeId });
    return response.data.user;
};

export const updateProfile = async (
    input: UpdateProfileInput,
    imageUri?: string
): Promise<User> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(input));

    if (imageUri && !imageUri.startsWith('http')) {
        await appendLocalFile(
            formData,
            'file',
            createLocalUpload(imageUri, 'profile.jpg', 'image/jpeg')
        );
    }

    const response = await choirApi.put<UserResponse>(
        '/users/me',
        formData,
        getMultipartRequestConfig()
    );
    return response.data.user;
};

export const getApiErrorMessage = (error: object): string => {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (
            responseData &&
            typeof responseData === 'object' &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message;
        }
    }

    return error instanceof Error ? error.message : 'No fue posible completar la solicitud';
};
