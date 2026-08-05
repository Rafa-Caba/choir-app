// src/services/deviceIdentity.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceIdStorageKey } from '../storage/tenantStorage';

const createDeviceId = (): string => {
    const randomPart = Math.random().toString(36).slice(2, 12);
    return `choir-${Date.now().toString(36)}-${randomPart}`;
};

let deviceIdPromise: Promise<string> | null = null;

const resolveDeviceId = async (): Promise<string> => {
    const key = getDeviceIdStorageKey();
    const existing = await AsyncStorage.getItem(key);

    if (existing) {
        return existing;
    }

    const created = createDeviceId();
    await AsyncStorage.setItem(key, created);
    return created;
};

export const getOrCreateDeviceId = (): Promise<string> => {
    deviceIdPromise ??= resolveDeviceId().catch((error: Error) => {
        deviceIdPromise = null;
        throw error;
    });

    return deviceIdPromise;
};
