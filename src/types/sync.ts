// src/types/sync.ts

export interface TenantStorageContext {
    readonly choirId: string;
    readonly userId: string;
}

export interface CacheEnvelope<T> {
    readonly version: 1;
    readonly data: T;
    readonly etag: string | null;
    readonly syncedAt: string;
    readonly expiresAt: string;
}

export interface CachedSessionMetadata {
    readonly userId: string;
    readonly choirId: string | null;
    readonly validatedAt: string;
}

export type CacheResource =
    | 'session'
    | 'settings'
    | 'theme'
    | 'themes'
    | 'announcements'
    | 'blog'
    | 'gallery'
    | 'songs'
    | 'song-types'
    | 'chat'
    | 'chat-media'
    | 'users'
    | 'choirs';

export type MediaCacheCategory = 'gallery' | 'songs' | 'chat' | 'announcements' | 'blog' | 'users' | 'settings';

export interface SyncResult<T> {
    readonly data: T;
    readonly source: 'cache' | 'network' | 'not-modified';
    readonly isStale: boolean;
}
