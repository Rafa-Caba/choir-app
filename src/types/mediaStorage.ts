// src/types/mediaStorage.ts

import type { MediaCacheCategory, TenantStorageContext } from './sync';

export type MediaKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
export type MediaStorageLocation = 'CACHE' | 'DOCUMENTS';
export type MediaAutoDownloadPolicy = 'NEVER' | 'WIFI_ONLY' | 'ALWAYS';
export type MediaDownloadState =
    | 'IDLE'
    | 'CHECKING'
    | 'DOWNLOADING'
    | 'READY'
    | 'ERROR';

export interface MediaStoragePreferences {
    readonly version: 1;
    readonly autoDownload: MediaAutoDownloadPolicy;
    readonly keepDownloadedFiles: boolean;
    readonly updatedAt: string;
}

export interface StoredMediaRecord {
    readonly id: string;
    readonly remoteUrl: string;
    readonly localUri: string;
    readonly filename: string;
    readonly mimeType: string;
    readonly kind: MediaKind;
    readonly category: MediaCacheCategory;
    readonly location: MediaStorageLocation;
    readonly bytes: number;
    readonly createdAt: string;
    readonly lastAccessedAt: string;
}

export interface MediaStorageIndex {
    readonly version: 1;
    readonly records: readonly StoredMediaRecord[];
}

export interface MediaStorageStats {
    readonly totalBytes: number;
    readonly cachedBytes: number;
    readonly downloadedBytes: number;
    readonly fileCount: number;
    readonly cachedFileCount: number;
    readonly downloadedFileCount: number;
}

export interface MediaDownloadProgress {
    readonly bytesWritten: number;
    readonly totalBytes: number;
    readonly fraction: number;
}

export interface MediaDownloadRequest {
    readonly context: TenantStorageContext;
    readonly category: MediaCacheCategory;
    readonly remoteUrl: string;
    readonly filename?: string;
    readonly mimeType?: string;
    readonly kind: MediaKind;
    readonly location: MediaStorageLocation;
    readonly retries?: number;
    readonly onProgress?: (progress: MediaDownloadProgress) => void;
}

export interface MediaDownloadResult {
    readonly record: StoredMediaRecord;
    readonly reused: boolean;
}
