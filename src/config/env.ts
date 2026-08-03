// src/config/env.ts

import { Platform } from 'react-native';

const API_PREFIX = '/api';
const ANDROID_EMULATOR_API_HOST = 'http://10.0.2.2:10000';
const IOS_SIMULATOR_API_HOST = 'http://localhost:10000';

const removeTrailingSlashes = (value: string): string => value.trim().replace(/\/+$/, '');

const normalizeDevelopmentHost = (rawUrl: string): string => {
    const trimmedUrl = removeTrailingSlashes(rawUrl);

    if (!__DEV__ || Platform.OS !== 'android') {
        return trimmedUrl;
    }

    return trimmedUrl
        .replace('://localhost:', '://10.0.2.2:')
        .replace('://127.0.0.1:', '://10.0.2.2:');
};

const resolveApiHost = (): string => {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

    if (configuredUrl) {
        return normalizeDevelopmentHost(configuredUrl);
    }

    if (__DEV__) {
        return Platform.OS === 'android'
            ? ANDROID_EMULATOR_API_HOST
            : IOS_SIMULATOR_API_HOST;
    }

    throw new Error('EXPO_PUBLIC_API_URL is required for production builds');
};

const API_HOST = resolveApiHost();
const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();

const ENV = {
    API_HOST,
    API_BASE_URL: `${API_HOST}/${API_PREFIX.replace(/^\/+/, '')}`,
    SOCKET_URL: socketUrl ? normalizeDevelopmentHost(socketUrl) : API_HOST
};

export default ENV;
