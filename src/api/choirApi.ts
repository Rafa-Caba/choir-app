import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PROD_URL = 'https://choir-app-api-production.up.railway.app/api';

// 2. Define your Local IPs
const LOCAL_IP = '10.10.1.98'; 

const LOCAL_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080/api' 
    : `http://${LOCAL_IP}:8080/api`;

// 3. Select based on Environment
const BASE_URL = __DEV__ ? LOCAL_URL : PROD_URL;

const choirApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the Token to every request
choirApi.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR ---
choirApi.interceptors.response.use(
    (response) => response, // Return success responses as is
    async (error) => {
        // Check if error is 401 (Unauthorized) or 403 (Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            
            // 1. Clear tokens
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            
            // Ideally, import the store directly to reset state:
            // (This requires you to export the store instance, which you do)
            const { useAuthStore } = require('../store/useAuthStore'); 
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default choirApi;