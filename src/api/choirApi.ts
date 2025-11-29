import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import ENV from '../config/env';

const { LOCAL_IP, PORT, PROD_URL } = ENV;

const LOCAL_URL = Platform.OS === 'android'
    ? `http://10.0.2.2:${PORT}`
    : `http://${LOCAL_IP}:${PORT}`;

// Switch to PROD_URL when building for release
const BASE_URL = `${__DEV__ ? LOCAL_URL : PROD_URL}/api`;
console.log({ BASE_URL });


const choirApi = axios.create({
    baseURL: BASE_URL,
});

// --- REQUEST INTERCEPTOR ---
choirApi.interceptors.request.use(
    async (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR (Refresh Token Logic) ---
choirApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 (Unauthorized) and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log("🔄 Token expired. Attempting refresh...");

                const refreshToken = useAuthStore.getState().refreshToken;
                if (!refreshToken) throw new Error("No refresh token");

                // 1. Request new token
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {
                    token: refreshToken
                });

                const { accessToken } = response.data;

                // 2. Update Store
                useAuthStore.getState().setAccessToken(accessToken);

                // 3. Retry original request with new token
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return choirApi(originalRequest);

            } catch (refreshError) {
                console.log("🔒 Session expired completely. Logging out.");
                // The store's logout action handles clearing AsyncStorage('auth-storage')
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default choirApi;