// src/api/choirApi.ts

import axios, {
    AxiosError,
    type InternalAxiosRequestConfig
} from 'axios';
import ENV from '../config/env';
import type { AuthSessionResponse } from '../types/auth';
import { authBridge } from './authTokenBridge';
import { tenantContextBridge } from './tenantContextBridge';
import { getOrCreateDeviceId } from '../services/deviceIdentity';

const API_BASE_URL = ENV.API_BASE_URL;

interface ApiErrorPayload {
    readonly code?: string;
    readonly message?: string;
}

interface FailedRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const choirApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false
});

const TERMINAL_SESSION_CODES = new Set([
    'AUTHENTICATED_USER_NOT_FOUND',
    'SESSION_REVOKED',
    'USER_INACTIVE',
    'CHOIR_INACTIVE'
]);

let refreshPromise: Promise<AuthSessionResponse> | null = null;

const refreshSession = async (): Promise<AuthSessionResponse> => {
    const refreshToken = authBridge.getRefreshToken();

    if (!refreshToken) {
        throw new Error('No refresh token is available');
    }

    const response = await axios.post<AuthSessionResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
    );

    await authBridge.applySession(response.data);
    return response.data;
};

choirApi.interceptors.request.use(
    async (config) => {
        const accessToken = authBridge.getAccessToken();
        const targetChoirId = tenantContextBridge.getTargetChoirId();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            config.headers['x-device-id'] = await getOrCreateDeviceId();
        }

        if (targetChoirId) {
            config.headers['x-target-choir-id'] = targetChoirId;
        }

        return config;
    },
    (error: AxiosError<ApiErrorPayload>) => Promise.reject(error)
);

choirApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorPayload>) => {
        const originalRequest = error.config as FailedRequestConfig | undefined;
        const errorCode = error.response?.data?.code;

        if (errorCode && TERMINAL_SESSION_CODES.has(errorCode)) {
            await authBridge.expireSession();
            return Promise.reject(error);
        }

        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            refreshPromise ??= refreshSession().finally(() => {
                refreshPromise = null;
            });

            const session = await refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
            return choirApi(originalRequest);
        } catch (refreshError) {
            const refreshStatus = axios.isAxiosError(refreshError)
                ? refreshError.response?.status
                : undefined;
            const refreshWasRejected = refreshStatus === 400 ||
                refreshStatus === 401 ||
                refreshStatus === 403;

            if (refreshWasRejected) {
                await authBridge.expireSession();
            }

            return Promise.reject(refreshError);
        }
    }
);

export default choirApi;
export { API_BASE_URL };
