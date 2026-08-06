// src/storage/mediaStoragePreferences.ts

import type {
    MediaAutoDownloadPolicy,
    MediaStoragePreferences
} from '../types/mediaStorage';
import type { TenantStorageContext } from '../types/sync';
import {
    buildTenantStoragePrefix,
    readJson,
    writeJson
} from './tenantStorage';

const PREFERENCES_SUFFIX = 'media-storage-preferences';

export const DEFAULT_MEDIA_STORAGE_PREFERENCES: MediaStoragePreferences = {
    version: 1,
    autoDownload: 'WIFI_ONLY',
    keepDownloadedFiles: true,
    updatedAt: new Date(0).toISOString()
};

const isAutoDownloadPolicy = (
    value: string
): value is MediaAutoDownloadPolicy => {
    return value === 'NEVER' || value === 'WIFI_ONLY' || value === 'ALWAYS';
};

const buildPreferencesKey = (context: TenantStorageContext): string => {
    return `${buildTenantStoragePrefix(context)}:${PREFERENCES_SUFFIX}`;
};

const normalizePreferences = (
    value: MediaStoragePreferences | null
): MediaStoragePreferences => {
    if (!value || value.version !== 1) {
        return DEFAULT_MEDIA_STORAGE_PREFERENCES;
    }

    return {
        version: 1,
        autoDownload: isAutoDownloadPolicy(value.autoDownload)
            ? value.autoDownload
            : DEFAULT_MEDIA_STORAGE_PREFERENCES.autoDownload,
        keepDownloadedFiles: value.keepDownloadedFiles === true,
        updatedAt: Number.isNaN(Date.parse(value.updatedAt))
            ? new Date().toISOString()
            : value.updatedAt
    };
};

export const loadMediaStoragePreferences = async (
    context: TenantStorageContext
): Promise<MediaStoragePreferences> => {
    const stored = await readJson<MediaStoragePreferences>(
        buildPreferencesKey(context)
    );

    return normalizePreferences(stored);
};

export const saveMediaStoragePreferences = async (
    context: TenantStorageContext,
    preferences: Pick<
        MediaStoragePreferences,
        'autoDownload' | 'keepDownloadedFiles'
    >
): Promise<MediaStoragePreferences> => {
    const value: MediaStoragePreferences = {
        version: 1,
        autoDownload: preferences.autoDownload,
        keepDownloadedFiles: preferences.keepDownloadedFiles,
        updatedAt: new Date().toISOString()
    };

    await writeJson(buildPreferencesKey(context), value);
    return value;
};
