// src/storage/mediaCache.ts

import { Platform } from 'react-native';
import type { MediaKind } from '../types/mediaStorage';
import type { MediaCacheCategory, TenantStorageContext } from '../types/sync';
import {
    clearAllTenantMedia,
    downloadMediaFile
} from './mediaStorage';

const inferMediaKind = (
    category: MediaCacheCategory,
    remoteUrl: string
): MediaKind => {
    const cleanUrl = remoteUrl.split('?')[0].toLowerCase();

    if (/\.(mp4|mov|m4v|webm)$/.test(cleanUrl)) {
        return 'VIDEO';
    }

    if (/\.(mp3|m4a|wav|aac|ogg)$/.test(cleanUrl)) {
        return 'AUDIO';
    }

    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/.test(cleanUrl)) {
        return 'DOCUMENT';
    }

    return category === 'songs' ? 'DOCUMENT' : 'IMAGE';
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

    try {
        const result = await downloadMediaFile({
            context,
            category,
            remoteUrl,
            kind: inferMediaKind(category, remoteUrl),
            location: 'CACHE'
        });
        return result.record.localUri;
    } catch {
        return remoteUrl;
    }
};

export const clearTenantMediaCache = async (
    context: TenantStorageContext
): Promise<void> => {
    await clearAllTenantMedia(context);
};
