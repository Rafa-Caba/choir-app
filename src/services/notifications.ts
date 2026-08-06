// src/services/notifications.ts

import choirApi from '../api/choirApi';
import type {
    NotificationCategory,
    NotificationReadResponse,
    NotificationsResponse,
    NotificationSummaryResponse
} from '../types/notification';

export const getNotifications = async (
    limit = 100,
    signal?: AbortSignal
): Promise<NotificationsResponse> => {
    const response = await choirApi.get<NotificationsResponse>('/notifications', {
        params: { limit },
        signal
    });

    return response.data;
};

export const markNotificationRead = async (
    notificationId: string
): Promise<NotificationReadResponse> => {
    const response = await choirApi.patch<NotificationReadResponse>(
        `/notifications/${notificationId}/read`
    );

    return response.data;
};

export const markNotificationsRead = async (
    category?: NotificationCategory
): Promise<NotificationSummaryResponse> => {
    const response = await choirApi.patch<NotificationSummaryResponse>(
        '/notifications/read-all',
        category ? { category } : {}
    );

    return response.data;
};
