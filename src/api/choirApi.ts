// /src/api/choirApi.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import ENV from '../config/env';
import { authBridge } from './authTokenBridge';

const API_BASE_URL = ENV.API_BASE_URL;

interface FailedRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface RefreshResponse {
    accessToken?: string;
}

const choirApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

console.log('🎯 choirApi baseURL:', API_BASE_URL);

// --- REQUEST INTERCEPTOR ---
choirApi.interceptors.request.use(
    async (config) => {
        const token = authBridge.getAccessToken();

        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR (Refresh Token Logic) ---
choirApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as FailedRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // If backend says 401, try refresh once
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log('🔄 Token expired. Attempting refresh...');

                const refreshToken = authBridge.getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Backend accepts: req.body.token OR req.body.refreshToken
                const refreshRes = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = refreshRes.data;

                if (!accessToken) {
                    throw new Error('No accessToken in refresh response');
                }

                // Update auth store via bridge
                authBridge.setAccessToken(accessToken);

                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return choirApi(originalRequest);
            } catch (refreshError) {
                console.log('🔒 Session expired completely. Logging out.');
                await authBridge.logout();

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default choirApi;
export { API_BASE_URL };