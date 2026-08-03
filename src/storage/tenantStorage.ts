// src/storage/tenantStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthenticatedChoir, User } from '../types/auth';
import type { CachedSessionMetadata, CacheResource, TenantStorageContext } from '../types/sync';

const ROOT_NAMESPACE = 'choir-app';
const LAST_CHOIR_CODE_KEY = `${ROOT_NAMESPACE}:preference:last-choir-code`;
const SESSION_POINTER_KEY = `${ROOT_NAMESPACE}:session:active-context`;
const DEVICE_ID_KEY = `${ROOT_NAMESPACE}:device:id`;

const LEGACY_STORAGE_KEYS = [
    'auth-storage',
    'announcement-storage',
    'app-config-storage',
    'blog-storage',
    'chat-storage',
    'gallery-storage',
    'songs-storage',
    'theme-storage'
] as const;

export interface PersistedSessionContext {
    readonly user: User;
    readonly choir: AuthenticatedChoir | null;
    readonly requiresPasswordChange: boolean;
    readonly metadata: CachedSessionMetadata;
}

export const buildTenantStoragePrefix = (context: TenantStorageContext): string => {
    return `${ROOT_NAMESPACE}:${context.choirId}:${context.userId}`;
};

export const buildTenantStorageKey = (
    context: TenantStorageContext,
    resource: CacheResource
): string => {
    return `${buildTenantStoragePrefix(context)}:${resource}`;
};

export const writeJson = async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const readJson = async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        await AsyncStorage.removeItem(key);
        return null;
    }
};

export const saveLastChoirCode = async (choirCode: string): Promise<void> => {
    const normalized = choirCode.trim().toLowerCase();

    if (normalized.length === 0) {
        return;
    }

    await AsyncStorage.setItem(LAST_CHOIR_CODE_KEY, normalized);
};

export const loadLastChoirCode = async (): Promise<string> => {
    return (await AsyncStorage.getItem(LAST_CHOIR_CODE_KEY)) ?? '';
};

export const savePersistedSessionContext = async (
    context: PersistedSessionContext
): Promise<void> => {
    await writeJson(SESSION_POINTER_KEY, context);
};

export const loadPersistedSessionContext = async (): Promise<PersistedSessionContext | null> => {
    return readJson<PersistedSessionContext>(SESSION_POINTER_KEY);
};

export const clearPersistedSessionContext = async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSION_POINTER_KEY);
};

export const clearTenantStorage = async (context: TenantStorageContext): Promise<void> => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `${buildTenantStoragePrefix(context)}:`;
    const tenantKeys = keys.filter((key) => key.startsWith(prefix));

    if (tenantKeys.length > 0) {
        await AsyncStorage.multiRemove(tenantKeys);
    }
};

export const clearLegacyStorage = async (): Promise<void> => {
    await AsyncStorage.multiRemove([...LEGACY_STORAGE_KEYS]);
};

export const getDeviceIdStorageKey = (): string => DEVICE_ID_KEY;
