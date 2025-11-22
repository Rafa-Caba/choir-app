import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ⚠️ REPLACE THIS WITH YOUR COMPUTER'S LOCAL IP ADDRESS IF TESTING ON PHYSICAL DEVICE
const DEV_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080/api' 
    : 'http://10.10.1.98:8080/api'; 

// Use your Railway URL for production later
const PROD_URL = 'https://your-railway-app.up.railway.app/api';

const choirApi = axios.create({
    baseURL: DEV_URL, // Switch to PROD_URL when deploying
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

export default choirApi;