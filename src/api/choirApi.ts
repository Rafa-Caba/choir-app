import axios from 'axios';
import { authBridge } from './authTokenBridge';

// const API_BASE_URL = 'http://localhost:10000/api';
const API_BASE_URL = 'http://10.0.2.2:10000/api';

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
    (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR (Refresh Token Logic) ---
choirApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;

        if (!originalRequest) return Promise.reject(error);

        // If backend says 401, try refresh once
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                console.log('🔄 Token expired. Attempting refresh...');

                const refreshToken = authBridge.getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');

                // Backend accepts: req.body.token OR req.body.refreshToken
                const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = refreshRes.data || {};
                if (!accessToken) throw new Error('No accessToken in refresh response');

                // Update auth store via bridge (no imports here)
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
