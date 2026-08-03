// src/storage/cacheStorage.ts

import type { CacheEnvelope, CacheResource, TenantStorageContext } from '../types/sync';
import { buildTenantStorageKey, readJson, writeJson } from './tenantStorage';

const resolveSyncTimestamp = (value?: string | null): string => {
    if (value && !Number.isNaN(Date.parse(value))) {
        return new Date(value).toISOString();
    }

    return new Date().toISOString();
};

export const readCache = async <T>(
    context: TenantStorageContext,
    resource: CacheResource
): Promise<CacheEnvelope<T> | null> => {
    const envelope = await readJson<CacheEnvelope<T>>(
        buildTenantStorageKey(context, resource)
    );

    if (!envelope || envelope.version !== 1) {
        return null;
    }

    return envelope;
};

export const writeCache = async <T>(
    context: TenantStorageContext,
    resource: CacheResource,
    data: T,
    etag: string | null,
    ttlMs: number,
    syncedAt?: string | null
): Promise<CacheEnvelope<T>> => {
    const now = Date.now();
    const envelope: CacheEnvelope<T> = {
        version: 1,
        data,
        etag,
        syncedAt: resolveSyncTimestamp(syncedAt),
        expiresAt: new Date(now + ttlMs).toISOString()
    };

    await writeJson(buildTenantStorageKey(context, resource), envelope);
    return envelope;
};

export const touchCache = async <T>(
    context: TenantStorageContext,
    resource: CacheResource,
    envelope: CacheEnvelope<T>,
    ttlMs: number,
    syncedAt?: string | null
): Promise<CacheEnvelope<T>> => {
    return writeCache(
        context,
        resource,
        envelope.data,
        envelope.etag,
        ttlMs,
        syncedAt
    );
};

export const isCacheStale = <T>(envelope: CacheEnvelope<T>): boolean => {
    return Date.parse(envelope.expiresAt) <= Date.now();
};
