// src/storage/mediaStorage.ts

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import type {
    MediaDownloadProgress,
    MediaDownloadRequest,
    MediaDownloadResult,
    MediaKind,
    MediaStorageIndex,
    MediaStorageLocation,
    MediaStorageStats,
    StoredMediaRecord
} from '../types/mediaStorage';
import type { MediaCacheCategory, TenantStorageContext } from '../types/sync';
import { loadMediaStoragePreferences } from './mediaStoragePreferences';
import {
    buildTenantStoragePrefix,
    readJson,
    writeJson
} from './tenantStorage';

const INDEX_SUFFIX = 'media-storage-index';
const DEFAULT_TEMPORARY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_RETRY_COUNT = 2;

let storageMutationQueue: Promise<void> = Promise.resolve();
const activeDownloads = new Map<string, Promise<MediaDownloadResult>>();
const mediaIndexCache = new Map<string, MediaStorageIndex>();
const mediaIndexLoaders = new Map<string, Promise<MediaStorageIndex>>();

export class MediaStorageError extends Error {
    readonly code:
        | 'DIRECTORY_UNAVAILABLE'
        | 'DOWNLOAD_FAILED'
        | 'FILE_UNAVAILABLE'
        | 'NETWORK_UNAVAILABLE';

    constructor(
        code: MediaStorageError['code'],
        message: string
    ) {
        super(message);
        this.name = 'MediaStorageError';
        this.code = code;
    }
}

const runStorageMutation = async <T>(
    operation: () => Promise<T>
): Promise<T> => {
    const next = storageMutationQueue.then(operation, operation);
    storageMutationQueue = next.then(
        () => undefined,
        () => undefined
    );
    return next;
};

const hashText = (value: string): string => {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
};

const extensionByMimeType: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

const defaultExtensionByKind: Readonly<Record<MediaKind, string>> = {
    IMAGE: 'jpg',
    VIDEO: 'mp4',
    AUDIO: 'm4a',
    DOCUMENT: 'bin'
};

const getIndexKey = (context: TenantStorageContext): string => {
    return `${buildTenantStoragePrefix(context)}:${INDEX_SUFFIX}`;
};

const getIndexCacheKey = (context: TenantStorageContext): string => {
    return `${context.choirId}:${context.userId}`;
};

const emptyIndex = (): MediaStorageIndex => ({
    version: 1,
    records: []
});

const readIndex = async (
    context: TenantStorageContext
): Promise<MediaStorageIndex> => {
    const cacheKey = getIndexCacheKey(context);
    const cached = mediaIndexCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const currentLoader = mediaIndexLoaders.get(cacheKey);

    if (currentLoader) {
        return currentLoader;
    }

    const loader = readJson<MediaStorageIndex>(getIndexKey(context))
        .then((value) => {
            const resolved = value &&
                value.version === 1 &&
                Array.isArray(value.records)
                ? value
                : emptyIndex();
            mediaIndexCache.set(cacheKey, resolved);
            return resolved;
        })
        .finally(() => {
            mediaIndexLoaders.delete(cacheKey);
        });

    mediaIndexLoaders.set(cacheKey, loader);
    return loader;
};

const writeIndex = async (
    context: TenantStorageContext,
    index: MediaStorageIndex
): Promise<void> => {
    mediaIndexCache.set(getIndexCacheKey(context), index);
    await writeJson(getIndexKey(context), index);
};

const removeRecordById = async (
    context: TenantStorageContext,
    recordId: string
): Promise<void> => {
    await runStorageMutation(async () => {
        const index = await readIndex(context);
        const records = index.records.filter((record) => record.id !== recordId);

        if (records.length !== index.records.length) {
            await writeIndex(context, { version: 1, records });
        }
    });
};

const upsertRecord = async (
    context: TenantStorageContext,
    record: StoredMediaRecord
): Promise<StoredMediaRecord> => {
    return runStorageMutation(async () => {
        const index = await readIndex(context);
        const records = [
            ...index.records.filter((item) => item.id !== record.id),
            record
        ];
        await writeIndex(context, { version: 1, records });
        return record;
    });
};

const sanitizeFilenameSegment = (value: string): string => {
    const decoded = (() => {
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    })();

    const normalized = decoded
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+/, '')
        .slice(0, 120);

    return normalized || 'archivo';
};

const getExtensionFromFilename = (value: string): string | null => {
    const clean = value.split('?')[0].split('#')[0];
    const finalSegment = clean.split('/').pop() ?? '';
    const dotIndex = finalSegment.lastIndexOf('.');

    if (dotIndex < 0 || dotIndex === finalSegment.length - 1) {
        return null;
    }

    const extension = finalSegment.slice(dotIndex + 1).toLowerCase();
    return /^[a-z0-9]{1,10}$/.test(extension) ? extension : null;
};

const resolveExtension = (
    remoteUrl: string,
    filename: string | undefined,
    mimeType: string | undefined,
    kind: MediaKind
): string => {
    const fromFilename = filename ? getExtensionFromFilename(filename) : null;
    const normalizedMime = mimeType?.trim().toLowerCase() ?? '';
    const fromMime = extensionByMimeType[normalizedMime];
    const fromUrl = getExtensionFromFilename(remoteUrl);

    return fromFilename ?? fromMime ?? fromUrl ?? defaultExtensionByKind[kind];
};

const resolveSafeFilename = (
    remoteUrl: string,
    filename: string | undefined,
    mimeType: string | undefined,
    kind: MediaKind
): string => {
    const remoteName = remoteUrl.split('?')[0].split('/').pop() ?? '';
    const baseCandidate = filename?.trim() || remoteName || 'archivo';
    const safeCandidate = sanitizeFilenameSegment(baseCandidate);
    const extension = resolveExtension(remoteUrl, filename, mimeType, kind);
    const currentExtension = getExtensionFromFilename(safeCandidate);
    const base = currentExtension
        ? safeCandidate.slice(0, -(currentExtension.length + 1))
        : safeCandidate;

    return `${sanitizeFilenameSegment(base)}.${extension}`;
};

const requireBaseDirectory = (location: MediaStorageLocation): string => {
    const directory = location === 'DOCUMENTS'
        ? FileSystem.documentDirectory
        : FileSystem.cacheDirectory;

    if (!directory) {
        throw new MediaStorageError(
            'DIRECTORY_UNAVAILABLE',
            'The requested application storage directory is unavailable'
        );
    }

    return directory;
};

export const buildTenantMediaDirectory = (
    context: TenantStorageContext,
    category: MediaCacheCategory,
    location: MediaStorageLocation
): string => {
    const root = location === 'DOCUMENTS' ? 'downloads' : 'cache';
    return `${requireBaseDirectory(location)}${root}/choirs/${context.choirId}/${context.userId}/${category}/`;
};

const ensureDirectory = async (directory: string): Promise<void> => {
    const info = await FileSystem.getInfoAsync(directory);

    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
};

const buildRecordId = (
    remoteUrl: string,
    location: MediaStorageLocation
): string => {
    return hashText(`${location}:${remoteUrl}`);
};

const buildDownloadKey = (request: MediaDownloadRequest): string => {
    return [
        request.context.choirId,
        request.context.userId,
        request.location,
        request.category,
        request.remoteUrl
    ].join(':');
};

const getFileSize = async (uri: string): Promise<number> => {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return info.exists && typeof info.size === 'number' ? info.size : 0;
};

const touchRecord = async (
    context: TenantStorageContext,
    record: StoredMediaRecord
): Promise<StoredMediaRecord> => {
    return upsertRecord(context, {
        ...record,
        lastAccessedAt: new Date().toISOString()
    });
};

export const getStoredMediaRecord = async (
    context: TenantStorageContext,
    remoteUrl: string,
    preferredLocation?: MediaStorageLocation
): Promise<StoredMediaRecord | null> => {
    if (!remoteUrl || Platform.OS === 'web') {
        return null;
    }

    const index = await readIndex(context);
    const candidates = index.records
        .filter((record) => record.remoteUrl === remoteUrl)
        .sort((left, right) => {
            if (preferredLocation) {
                const leftPreferred = left.location === preferredLocation ? 1 : 0;
                const rightPreferred = right.location === preferredLocation ? 1 : 0;

                if (leftPreferred !== rightPreferred) {
                    return rightPreferred - leftPreferred;
                }
            }

            if (left.location !== right.location) {
                return left.location === 'DOCUMENTS' ? -1 : 1;
            }

            return Date.parse(right.lastAccessedAt) - Date.parse(left.lastAccessedAt);
        });

    for (const record of candidates) {
        const info = await FileSystem.getInfoAsync(record.localUri);

        if (info.exists) {
            return touchRecord(context, record);
        }

        await removeRecordById(context, record.id);
    }

    return null;
};

const choosePreferredRecord = (
    current: StoredMediaRecord | undefined,
    candidate: StoredMediaRecord
): StoredMediaRecord => {
    if (!current) {
        return candidate;
    }

    if (current.location !== candidate.location) {
        return candidate.location === 'DOCUMENTS' ? candidate : current;
    }

    return Date.parse(candidate.lastAccessedAt) > Date.parse(current.lastAccessedAt)
        ? candidate
        : current;
};

export const getStoredMediaRecordsForUrls = async (
    context: TenantStorageContext,
    remoteUrls: readonly string[]
): Promise<ReadonlyMap<string, StoredMediaRecord>> => {
    if (Platform.OS === 'web' || remoteUrls.length === 0) {
        return new Map<string, StoredMediaRecord>();
    }

    const requestedUrls = new Set(remoteUrls.filter((url) => url.length > 0));
    const index = await readIndex(context);
    const selected = new Map<string, StoredMediaRecord>();

    for (const record of index.records) {
        if (!requestedUrls.has(record.remoteUrl)) {
            continue;
        }

        selected.set(
            record.remoteUrl,
            choosePreferredRecord(selected.get(record.remoteUrl), record)
        );
    }

    const checks = await Promise.all(
        [...selected.entries()].map(async ([remoteUrl, record]) => {
            const info = await FileSystem.getInfoAsync(record.localUri);
            return { remoteUrl, record, exists: info.exists };
        })
    );
    const valid = new Map<string, StoredMediaRecord>();
    const missingIds = new Set<string>();

    for (const check of checks) {
        if (check.exists) {
            valid.set(check.remoteUrl, check.record);
        } else {
            missingIds.add(check.record.id);
        }
    }

    if (missingIds.size > 0) {
        await runStorageMutation(async () => {
            const latest = await readIndex(context);
            await writeIndex(context, {
                version: 1,
                records: latest.records.filter((record) => !missingIds.has(record.id))
            });
        });
    }

    return valid;
};


const copyExistingRecord = async (
    request: MediaDownloadRequest,
    source: StoredMediaRecord,
    finalUri: string,
    resolvedFilename: string,
    normalizedMimeType: string
): Promise<MediaDownloadResult> => {
    await FileSystem.copyAsync({ from: source.localUri, to: finalUri });
    const now = new Date().toISOString();
    const record: StoredMediaRecord = {
        id: buildRecordId(request.remoteUrl, request.location),
        remoteUrl: request.remoteUrl,
        localUri: finalUri,
        filename: resolvedFilename,
        mimeType: normalizedMimeType,
        kind: request.kind,
        category: request.category,
        location: request.location,
        bytes: await getFileSize(finalUri),
        createdAt: now,
        lastAccessedAt: now
    };

    return {
        record: await upsertRecord(request.context, record),
        reused: true
    };
};

const performDownload = async (
    request: MediaDownloadRequest
): Promise<MediaDownloadResult> => {
    if (!request.remoteUrl) {
        throw new MediaStorageError(
            'FILE_UNAVAILABLE',
            'The media URL is unavailable'
        );
    }

    if (Platform.OS === 'web') {
        const now = new Date().toISOString();
        return {
            record: {
                id: buildRecordId(request.remoteUrl, request.location),
                remoteUrl: request.remoteUrl,
                localUri: request.remoteUrl,
                filename: resolveSafeFilename(
                    request.remoteUrl,
                    request.filename,
                    request.mimeType,
                    request.kind
                ),
                mimeType: request.mimeType ?? 'application/octet-stream',
                kind: request.kind,
                category: request.category,
                location: request.location,
                bytes: 0,
                createdAt: now,
                lastAccessedAt: now
            },
            reused: true
        };
    }

    const existing = await getStoredMediaRecord(
        request.context,
        request.remoteUrl,
        request.location
    );

    if (existing && (
        existing.location === request.location ||
        request.location === 'CACHE'
    )) {
        return { record: existing, reused: true };
    }

    const directory = buildTenantMediaDirectory(
        request.context,
        request.category,
        request.location
    );
    await ensureDirectory(directory);

    const resolvedFilename = resolveSafeFilename(
        request.remoteUrl,
        request.filename,
        request.mimeType,
        request.kind
    );
    const localFilename = `${hashText(request.remoteUrl)}-${resolvedFilename}`;
    const finalUri = `${directory}${localFilename}`;
    const partialUri = `${finalUri}.part`;
    const normalizedMimeType = request.mimeType?.trim().toLowerCase() ||
        'application/octet-stream';
    const finalInfo = await FileSystem.getInfoAsync(finalUri);

    if (finalInfo.exists) {
        const now = new Date().toISOString();
        const record: StoredMediaRecord = {
            id: buildRecordId(request.remoteUrl, request.location),
            remoteUrl: request.remoteUrl,
            localUri: finalUri,
            filename: resolvedFilename,
            mimeType: normalizedMimeType,
            kind: request.kind,
            category: request.category,
            location: request.location,
            bytes: await getFileSize(finalUri),
            createdAt: now,
            lastAccessedAt: now
        };
        return {
            record: await upsertRecord(request.context, record),
            reused: true
        };
    }

    if (request.location === 'DOCUMENTS' && existing) {
        return copyExistingRecord(
            request,
            existing,
            finalUri,
            resolvedFilename,
            normalizedMimeType
        );
    }

    const networkState = await Network.getNetworkStateAsync();

    if (networkState.isConnected === false || networkState.type === Network.NetworkStateType.NONE) {
        throw new MediaStorageError(
            'NETWORK_UNAVAILABLE',
            'No network connection is available to download the file'
        );
    }

    await FileSystem.deleteAsync(partialUri, { idempotent: true });
    const retries = Math.max(0, request.retries ?? DEFAULT_RETRY_COUNT);
    let finalError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const resumable = FileSystem.createDownloadResumable(
                request.remoteUrl,
                partialUri,
                {},
                (progressData) => {
                    const totalBytes = progressData.totalBytesExpectedToWrite;
                    const bytesWritten = progressData.totalBytesWritten;
                    const fraction = totalBytes > 0
                        ? Math.min(1, bytesWritten / totalBytes)
                        : 0;
                    const progress: MediaDownloadProgress = {
                        bytesWritten,
                        totalBytes,
                        fraction
                    };
                    request.onProgress?.(progress);
                }
            );
            const result = await resumable.downloadAsync();

            if (!result?.uri) {
                throw new MediaStorageError(
                    'DOWNLOAD_FAILED',
                    'The media download did not produce a local file'
                );
            }

            await FileSystem.deleteAsync(finalUri, { idempotent: true });
            await FileSystem.moveAsync({ from: result.uri, to: finalUri });
            const now = new Date().toISOString();
            const record: StoredMediaRecord = {
                id: buildRecordId(request.remoteUrl, request.location),
                remoteUrl: request.remoteUrl,
                localUri: finalUri,
                filename: resolvedFilename,
                mimeType: normalizedMimeType,
                kind: request.kind,
                category: request.category,
                location: request.location,
                bytes: await getFileSize(finalUri),
                createdAt: now,
                lastAccessedAt: now
            };

            request.onProgress?.({
                bytesWritten: record.bytes,
                totalBytes: record.bytes,
                fraction: 1
            });

            return {
                record: await upsertRecord(request.context, record),
                reused: false
            };
        } catch (error) {
            finalError = error instanceof Error
                ? error
                : new Error('Media download failed');
            await FileSystem.deleteAsync(partialUri, { idempotent: true })
                .catch(() => undefined);

            if (attempt < retries) {
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 350 * (attempt + 1));
                });
            }
        }
    }

    throw new MediaStorageError(
        'DOWNLOAD_FAILED',
        finalError?.message ?? 'The media download failed'
    );
};

export const downloadMediaFile = async (
    request: MediaDownloadRequest
): Promise<MediaDownloadResult> => {
    const key = buildDownloadKey(request);
    const current = activeDownloads.get(key);

    if (current) {
        return current;
    }

    const download = performDownload(request).finally(() => {
        activeDownloads.delete(key);
    });
    activeDownloads.set(key, download);
    return download;
};

const validRecordsWithSizes = async (
    context: TenantStorageContext
): Promise<readonly StoredMediaRecord[]> => {
    const index = await readIndex(context);
    const validRecords: StoredMediaRecord[] = [];

    for (const record of index.records) {
        const info = await FileSystem.getInfoAsync(record.localUri, { size: true });

        if (!info.exists) {
            continue;
        }

        validRecords.push({
            ...record,
            bytes: typeof info.size === 'number' ? info.size : record.bytes
        });
    }

    if (validRecords.length !== index.records.length) {
        await writeIndex(context, { version: 1, records: validRecords });
    }

    return validRecords;
};

export const getMediaStorageStats = async (
    context: TenantStorageContext
): Promise<MediaStorageStats> => {
    if (Platform.OS === 'web') {
        return {
            totalBytes: 0,
            cachedBytes: 0,
            downloadedBytes: 0,
            fileCount: 0,
            cachedFileCount: 0,
            downloadedFileCount: 0
        };
    }

    const records = await validRecordsWithSizes(context);
    const cachedRecords = records.filter((record) => record.location === 'CACHE');
    const downloadedRecords = records.filter((record) => record.location === 'DOCUMENTS');
    const cachedBytes = cachedRecords.reduce((total, record) => total + record.bytes, 0);
    const downloadedBytes = downloadedRecords.reduce((total, record) => total + record.bytes, 0);

    return {
        totalBytes: cachedBytes + downloadedBytes,
        cachedBytes,
        downloadedBytes,
        fileCount: records.length,
        cachedFileCount: cachedRecords.length,
        downloadedFileCount: downloadedRecords.length
    };
};

const deleteDirectoryIfPresent = async (directory: string): Promise<void> => {
    const info = await FileSystem.getInfoAsync(directory);

    if (info.exists) {
        await FileSystem.deleteAsync(directory, { idempotent: true });
    }
};

const buildTenantRootDirectory = (
    context: TenantStorageContext,
    location: MediaStorageLocation
): string => {
    const root = location === 'DOCUMENTS' ? 'downloads' : 'cache';
    return `${requireBaseDirectory(location)}${root}/choirs/${context.choirId}/${context.userId}/`;
};

export const clearTemporaryMedia = async (
    context: TenantStorageContext
): Promise<void> => {
    if (Platform.OS === 'web') {
        return;
    }

    await deleteDirectoryIfPresent(buildTenantRootDirectory(context, 'CACHE'));
    await runStorageMutation(async () => {
        const index = await readIndex(context);
        await writeIndex(context, {
            version: 1,
            records: index.records.filter((record) => record.location !== 'CACHE')
        });
    });
};

export const clearAllTenantMedia = async (
    context: TenantStorageContext
): Promise<void> => {
    if (Platform.OS !== 'web') {
        await Promise.all([
            deleteDirectoryIfPresent(buildTenantRootDirectory(context, 'CACHE')),
            deleteDirectoryIfPresent(buildTenantRootDirectory(context, 'DOCUMENTS'))
        ]);
    }

    await runStorageMutation(async () => {
        await writeIndex(context, emptyIndex());
    });
};

export const cleanupExpiredTemporaryMedia = async (
    context: TenantStorageContext,
    maxAgeMs = DEFAULT_TEMPORARY_RETENTION_MS
): Promise<number> => {
    if (Platform.OS === 'web') {
        return 0;
    }

    const threshold = Date.now() - Math.max(0, maxAgeMs);
    const index = await readIndex(context);
    const expired = index.records.filter((record) =>
        record.location === 'CACHE' &&
        Date.parse(record.lastAccessedAt) < threshold
    );

    for (const record of expired) {
        await FileSystem.deleteAsync(record.localUri, { idempotent: true })
            .catch(() => undefined);
    }

    if (expired.length > 0) {
        const expiredIds = new Set(expired.map((record) => record.id));
        await writeIndex(context, {
            version: 1,
            records: index.records.filter((record) => !expiredIds.has(record.id))
        });
    }

    return expired.length;
};

export const shouldAutoDownloadMedia = async (
    context: TenantStorageContext
): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return false;
    }

    const preferences = await loadMediaStoragePreferences(context);

    if (preferences.autoDownload === 'NEVER') {
        return false;
    }

    const networkState = await Network.getNetworkStateAsync();
    const connected = networkState.isConnected !== false &&
        networkState.type !== Network.NetworkStateType.NONE;

    if (!connected) {
        return false;
    }

    if (preferences.autoDownload === 'ALWAYS') {
        return true;
    }

    return networkState.type === Network.NetworkStateType.WIFI ||
        networkState.type === Network.NetworkStateType.ETHERNET;
};

export const formatMediaBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return 'Tamaño no disponible';
    }

    const units = ['B', 'KB', 'MB', 'GB'] as const;
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const digits = unitIndex === 0 || value >= 10 ? 0 : 1;
    return `${value.toFixed(digits)} ${units[unitIndex]}`;
};
