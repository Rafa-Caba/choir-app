// /src/config/env.ts

import { Platform } from 'react-native';

const API_PREFIX = '/api';

const PRODUCTION_API_HOST = 'https://ero-cras-webapp-api-production.up.railway.app';

const ANDROID_EMULATOR_API_HOST = 'http://10.0.2.2:10000';

const IOS_SIMULATOR_API_HOST = 'http://localhost:10000';

function removeTrailingSlashes(value: string): string {
    return value.trim().replace(/\/+$/, '');
}

function normalizeApiHost(rawUrl: string): string {
    const trimmedUrl = removeTrailingSlashes(rawUrl);

    if (!__DEV__) {
        return trimmedUrl;
    }

    if (Platform.OS === 'android') {
        return trimmedUrl
            .replace('://localhost:', '://10.0.2.2:')
            .replace('://127.0.0.1:', '://10.0.2.2:');
    }

    return trimmedUrl;
}

function getApiHost(): string {
    const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

    if (envApiUrl && envApiUrl.length > 0) {
        return normalizeApiHost(envApiUrl);
    }

    if (__DEV__) {
        if (Platform.OS === 'android') {
            return normalizeApiHost(ANDROID_EMULATOR_API_HOST);
        }

        if (Platform.OS === 'ios') {
            return normalizeApiHost(IOS_SIMULATOR_API_HOST);
        }
    }

    return normalizeApiHost(PRODUCTION_API_HOST);
}

function buildApiBaseUrl(apiHost: string): string {
    const normalizedPrefix = API_PREFIX.replace(/^\/+/, '');

    return `${apiHost}/${normalizedPrefix}`;
}

const API_HOST = getApiHost();

const ENV = {
    API_HOST,
    API_BASE_URL: buildApiBaseUrl(API_HOST),
    SOCKET_URL: API_HOST,
};

console.log('🔧 Environment Loaded:', {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? null,
    __DEV__,
    platform: Platform.OS,
    API_HOST: ENV.API_HOST,
    API_BASE_URL: ENV.API_BASE_URL,
    SOCKET_URL: ENV.SOCKET_URL,
});

export default ENV;