// src/services/sync.ts

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import choirApi from '../api/choirApi';
import { isCacheStale, readCache, touchCache, writeCache } from '../storage/cacheStorage';
import type { CacheEnvelope, CacheResource, SyncResult, TenantStorageContext } from '../types/sync';

const DEFAULT_TTL_MS = 15 * 60 * 1000;
type CacheableData = object | readonly object[];

interface IncrementalSyncOptions<T> {
    readonly merge: (cachedData: T, changedData: T) => T;
}

interface SyncOptions<T> {
    readonly context: TenantStorageContext;
    readonly resource: CacheResource;
    readonly path: string;
    readonly ttlMs?: number;
    readonly params?: Readonly<Record<string, string | number | boolean>>;
    readonly incremental?: IncrementalSyncOptions<T>;
    readonly onData?: (data: T, source: SyncResult<T>['source']) => void;
}

const getHeader = <T>(response: AxiosResponse<T>, name: string): string | null => {
    const value = response.headers[name.toLowerCase()];
    return typeof value === 'string' ? value : null;
};

const requestNetwork = async <T extends CacheableData>(
    options: SyncOptions<T>,
    cached: CacheEnvelope<T> | null
): Promise<AxiosResponse<T>> => {
    const headers: Record<string, string> = {};
    const params: Record<string, string | number | boolean> = {
        ...(options.params ?? {})
    };

    if (cached && options.incremental) {
        params.updatedSince = cached.syncedAt;
    } else if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
    }

    const config: AxiosRequestConfig = {
        headers,
        params,
        validateStatus: (status) => status === 200 || status === 304
    };

    return choirApi.get<T>(options.path, config);
};

export const syncCacheFirst = async <T extends CacheableData>(
    options: SyncOptions<T>
): Promise<SyncResult<T>> => {
    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    const cached = await readCache<T>(options.context, options.resource);

    if (cached) {
        options.onData?.(cached.data, 'cache');
    }

    try {
        const response = await requestNetwork(options, cached);

        if (response.status === 304 && cached) {
            const refreshed = await touchCache(
                options.context,
                options.resource,
                cached,
                ttlMs,
                getHeader(response, 'x-sync-timestamp')
            );
            options.onData?.(refreshed.data, 'not-modified');
            return {
                data: refreshed.data,
                source: 'not-modified',
                isStale: false
            };
        }

        const networkData = cached && options.incremental
            ? options.incremental.merge(cached.data, response.data)
            : response.data;
        const updated = await writeCache(
            options.context,
            options.resource,
            networkData,
            options.incremental ? null : getHeader(response, 'etag'),
            ttlMs,
            getHeader(response, 'x-sync-timestamp')
        );
        options.onData?.(updated.data, 'network');

        return {
            data: updated.data,
            source: 'network',
            isStale: false
        };
    } catch (error) {
        const responseStatus = axios.isAxiosError(error)
            ? error.response?.status
            : undefined;
        const isAuthorizationFailure = responseStatus === 401 || responseStatus === 403;

        if (cached && !isAuthorizationFailure) {
            return {
                data: cached.data,
                source: 'cache',
                isStale: isCacheStale(cached)
            };
        }

        throw error;
    }
};
