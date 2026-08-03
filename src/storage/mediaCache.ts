// src/storage/mediaCache.ts

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { MediaCacheCategory, TenantStorageContext } from '../types/sync';

const hashText = (value: string): string => {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16);
};

const getFileExtension = (url: string): string => {
    const cleanUrl = url.split('?')[0];
    const finalSegment = cleanUrl.split('/').pop() ?? '';
    const extension = finalSegment.includes('.') ? finalSegment.split('.').pop() : null;

    if (!extension || !/^[a-z0-9]{1,8}$/i.test(extension)) {
        return 'bin';
    }

    return extension.toLowerCase();
};

const requireCacheDirectory = (): string => {
    if (!FileSystem.cacheDirectory) {
        throw new Error('The application cache directory is unavailable');
    }

    return FileSystem.cacheDirectory;
};

export const buildTenantMediaDirectory = (
    context: TenantStorageContext,
    category: MediaCacheCategory
): string => {
    return `${requireCacheDirectory()}cache/choirs/${context.choirId}/${context.userId}/${category}/`;
};

const ensureDirectory = async (directory: string): Promise<void> => {
    const info = await FileSystem.getInfoAsync(directory);

    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
};

export const cacheRemoteMedia = async (
    context: TenantStorageContext,
    category: MediaCacheCategory,
    remoteUrl: string | null | undefined
): Promise<string | null> => {
    if (!remoteUrl) {
        return null;
    }

    if (Platform.OS === 'web' || remoteUrl.startsWith('file:')) {
        return remoteUrl;
    }

    const directory = buildTenantMediaDirectory(context, category);
    await ensureDirectory(directory);

    const filename = `${hashText(remoteUrl)}.${getFileExtension(remoteUrl)}`;
    const localUri = `${directory}${filename}`;
    const existing = await FileSystem.getInfoAsync(localUri);

    if (existing.exists) {
        return localUri;
    }

    try {
        const download = await FileSystem.downloadAsync(remoteUrl, localUri);
        return download.uri;
    } catch {
        await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => undefined);
        return remoteUrl;
    }
};

export const clearTenantMediaCache = async (
    context: TenantStorageContext
): Promise<void> => {
    if (Platform.OS === 'web' || !FileSystem.cacheDirectory) {
        return;
    }

    const tenantDirectory = `${FileSystem.cacheDirectory}cache/choirs/${context.choirId}/${context.userId}/`;
    const info = await FileSystem.getInfoAsync(tenantDirectory);

    if (info.exists) {
        await FileSystem.deleteAsync(tenantDirectory, { idempotent: true });
    }
};
