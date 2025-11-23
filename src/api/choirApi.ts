import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PROD_URL = 'https://choir-api-production.up.railway.app/api';

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

export default choirApi;