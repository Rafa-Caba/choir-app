// src/storage/secureSessionStorage.ts

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface SecureSession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly sessionId: string;
    readonly userId: string;
}

const ACCESS_TOKEN_KEY = 'choir-app:secure:access-token';
const REFRESH_TOKEN_KEY = 'choir-app:secure:refresh-token';
const SESSION_ID_KEY = 'choir-app:secure:session-id';
const USER_ID_KEY = 'choir-app:secure:user-id';

const getWebSessionStorage = (): Storage | null => {
    if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') {
        return null;
    }

    return globalThis.sessionStorage;
};

const setValue = async (key: string, value: string): Promise<void> => {
    const webStorage = getWebSessionStorage();

    if (webStorage) {
        webStorage.setItem(key, value);
        return;
    }

    await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
};

const getValue = async (key: string): Promise<string | null> => {
    const webStorage = getWebSessionStorage();

    if (webStorage) {
        return webStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
};

const removeValue = async (key: string): Promise<void> => {
    const webStorage = getWebSessionStorage();

    if (webStorage) {
        webStorage.removeItem(key);
        return;
    }

    await SecureStore.deleteItemAsync(key);
};

export const saveSecureSession = async (session: SecureSession): Promise<void> => {
    await Promise.all([
        setValue(ACCESS_TOKEN_KEY, session.accessToken),
        setValue(REFRESH_TOKEN_KEY, session.refreshToken),
        setValue(SESSION_ID_KEY, session.sessionId),
        setValue(USER_ID_KEY, session.userId)
    ]);
};

export const loadSecureSession = async (): Promise<SecureSession | null> => {
    const [accessToken, refreshToken, sessionId, userId] = await Promise.all([
        getValue(ACCESS_TOKEN_KEY),
        getValue(REFRESH_TOKEN_KEY),
        getValue(SESSION_ID_KEY),
        getValue(USER_ID_KEY)
    ]);

    if (!accessToken || !refreshToken || !sessionId || !userId) {
        await Promise.all([
            removeValue(ACCESS_TOKEN_KEY),
            removeValue(REFRESH_TOKEN_KEY),
            removeValue(SESSION_ID_KEY),
            removeValue(USER_ID_KEY)
        ]);
        return null;
    }

    return { accessToken, refreshToken, sessionId, userId };
};

export const clearSecureSession = async (): Promise<void> => {
    await Promise.all([
        removeValue(ACCESS_TOKEN_KEY),
        removeValue(REFRESH_TOKEN_KEY),
        removeValue(SESSION_ID_KEY),
        removeValue(USER_ID_KEY)
    ]);
};
