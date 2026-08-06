// src/types/notification.ts

export type NotificationCategory = 'CHAT' | 'BLOG';

export type NotificationType =
    | 'CHAT_MESSAGE'
    | 'CHAT_REACTION'
    | 'BLOG_POST'
    | 'BLOG_COMMENT'
    | 'BLOG_REACTION';

export interface NotificationActor {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl?: string;
}

export interface AppNotification {
    readonly id: string;
    readonly category: NotificationCategory;
    readonly type: NotificationType;
    readonly title: string;
    readonly body: string;
    readonly resourceId: string;
    readonly resourceSubId?: string | null;
    readonly dedupeKey: string;
    readonly isRead: boolean;
    readonly readAt?: string | null;
    readonly actorUserId?: NotificationActor | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface NotificationSummary {
    readonly total: number;
    readonly chat: number;
    readonly blog: number;
}

export interface NotificationsResponse {
    readonly notifications: readonly AppNotification[];
    readonly summary: NotificationSummary;
}

export interface NotificationReadResponse {
    readonly notification: AppNotification;
}

export interface NotificationSummaryResponse {
    readonly summary: NotificationSummary;
}

export interface SocketNotificationRemoval {
    readonly id: string;
    readonly dedupeKey: string;
}
