// src/storage/secureSessionStorage.ts

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface SecureSession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly sessionId: string;
    readonly userId: string;
}

interface SecureStorageKey {
    readonly current: string;
    readonly legacyWeb: string;
}

const SECURE_STORAGE_KEYS = {
    accessToken: {
        current: 'choir_app_secure_access_token',
        legacyWeb: 'choir-app:secure:access-token'
    },
    refreshToken: {
        current: 'choir_app_secure_refresh_token',
        legacyWeb: 'choir-app:secure:refresh-token'
    },
    sessionId: {
        current: 'choir_app_secure_session_id',
        legacyWeb: 'choir-app:secure:session-id'
    },
    userId: {
        current: 'choir_app_secure_user_id',
        legacyWeb: 'choir-app:secure:user-id'
    }
} as const satisfies Record<keyof SecureSession, SecureStorageKey>;

const getWebSessionStorage = (): Storage | null => {
    if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') {
        return null;
    }

    return globalThis.sessionStorage;
};

const setValue = async (
    key: SecureStorageKey,
    value: string
): Promise<void> => {
    const webStorage = getWebSessionStorage();

    if (webStorage) {
        webStorage.setItem(key.current, value);
        webStorage.removeItem(key.legacyWeb);
        return;
    }

    await SecureStore.setItemAsync(key.current, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
};

const getValue = async (key: SecureStorageKey): Promise<string | null> => {
    const webStorage = getWebSessionStorage();

    if (!webStorage) {
        return SecureStore.getItemAsync(key.current);
    }

    const currentValue = webStorage.getItem(key.current);

    if (currentValue) {
        return currentValue;
    }

    const legacyValue = webStorage.getItem(key.legacyWeb);

    if (!legacyValue) {
        return null;
    }

    webStorage.setItem(key.current, legacyValue);
    webStorage.removeItem(key.legacyWeb);
    return legacyValue;
};

const removeValue = async (key: SecureStorageKey): Promise<void> => {
    const webStorage = getWebSessionStorage();

    if (webStorage) {
        webStorage.removeItem(key.current);
        webStorage.removeItem(key.legacyWeb);
        return;
    }

    await SecureStore.deleteItemAsync(key.current);
};

export const saveSecureSession = async (
    session: SecureSession
): Promise<void> => {
    await Promise.all([
        setValue(SECURE_STORAGE_KEYS.accessToken, session.accessToken),
        setValue(SECURE_STORAGE_KEYS.refreshToken, session.refreshToken),
        setValue(SECURE_STORAGE_KEYS.sessionId, session.sessionId),
        setValue(SECURE_STORAGE_KEYS.userId, session.userId)
    ]);
};

export const loadSecureSession = async (): Promise<SecureSession | null> => {
    const [accessToken, refreshToken, sessionId, userId] = await Promise.all([
        getValue(SECURE_STORAGE_KEYS.accessToken),
        getValue(SECURE_STORAGE_KEYS.refreshToken),
        getValue(SECURE_STORAGE_KEYS.sessionId),
        getValue(SECURE_STORAGE_KEYS.userId)
    ]);

    if (!accessToken || !refreshToken || !sessionId || !userId) {
        await clearSecureSession();
        return null;
    }

    return { accessToken, refreshToken, sessionId, userId };
};

export const clearSecureSession = async (): Promise<void> => {
    await Promise.all([
        removeValue(SECURE_STORAGE_KEYS.accessToken),
        removeValue(SECURE_STORAGE_KEYS.refreshToken),
        removeValue(SECURE_STORAGE_KEYS.sessionId),
        removeValue(SECURE_STORAGE_KEYS.userId)
    ]);
};
