// src/config/cachePolicy.ts

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const CACHE_TTL_MS = {
    announcements: 15 * MINUTE_MS,
    blog: 30 * MINUTE_MS,
    gallery: HOUR_MS,
    songs: HOUR_MS,
    songTypes: 6 * HOUR_MS,
    themes: 6 * HOUR_MS,
    settings: 6 * HOUR_MS,
    chat: 5 * MINUTE_MS
} as const;
