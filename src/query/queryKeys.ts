// src/query/queryKeys.ts

export const queryKeys = {
    tenantRoot: (tenantKey: string) => ['tenant', tenantKey] as const,
    settings: (tenantKey: string) => ['tenant', tenantKey, 'settings'] as const,
    themes: (tenantKey: string) => ['tenant', tenantKey, 'themes'] as const,
    announcements: (tenantKey: string) => ['tenant', tenantKey, 'announcements'] as const,
    blog: (tenantKey: string) => ['tenant', tenantKey, 'blog'] as const,
    gallery: (tenantKey: string) => ['tenant', tenantKey, 'gallery'] as const,
    songs: (tenantKey: string) => ['tenant', tenantKey, 'songs'] as const,
    songTypes: (tenantKey: string) => ['tenant', tenantKey, 'song-types'] as const,
    chatHistory: (tenantKey: string) => ['tenant', tenantKey, 'chat', 'history'] as const,
    chatMedia: (tenantKey: string) => ['tenant', tenantKey, 'chat', 'media'] as const,
    chatDirectory: (tenantKey: string) => ['tenant', tenantKey, 'chat', 'directory'] as const,
    chatMessageDetails: (tenantKey: string, messageId: string) =>
        ['tenant', tenantKey, 'chat', 'details', messageId] as const,
    notifications: (tenantKey: string) => ['tenant', tenantKey, 'notifications'] as const
};
