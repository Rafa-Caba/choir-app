// src/hooks/query/useNotificationsData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../query/queryKeys';
import {
    getNotifications,
    markNotificationRead,
    markNotificationsRead
} from '../../services/notifications';
import type {
    AppNotification,
    NotificationCategory,
    NotificationsResponse
} from '../../types/notification';
import { useTenantQueryScope } from './useTenantQueryScope';

const markCachedNotificationRead = (
    current: NotificationsResponse | undefined,
    notificationId: string
): NotificationsResponse | undefined => {
    if (!current) {
        return current;
    }

    const target = current.notifications.find(
        (notification) => notification.id === notificationId
    );

    if (!target || target.isRead) {
        return current;
    }

    const decrementCategory = target.category === 'CHAT'
        ? { chat: Math.max(0, current.summary.chat - 1) }
        : { blog: Math.max(0, current.summary.blog - 1) };

    return {
        notifications: current.notifications.map((notification) =>
            notification.id === notificationId
                ? {
                    ...notification,
                    isRead: true,
                    readAt: new Date().toISOString()
                }
                : notification
        ),
        summary: {
            ...current.summary,
            ...decrementCategory,
            total: Math.max(0, current.summary.total - 1)
        }
    };
};

const markCachedCategoryRead = (
    current: NotificationsResponse | undefined,
    category?: NotificationCategory
): NotificationsResponse | undefined => {
    if (!current) {
        return current;
    }

    const now = new Date().toISOString();
    const notifications = current.notifications.map((notification) => {
        const shouldRead = !notification.isRead &&
            (!category || notification.category === category);

        return shouldRead
            ? { ...notification, isRead: true, readAt: now }
            : notification;
    });
    const summary = category === 'CHAT'
        ? {
            ...current.summary,
            total: Math.max(0, current.summary.total - current.summary.chat),
            chat: 0
        }
        : category === 'BLOG'
            ? {
                ...current.summary,
                total: Math.max(0, current.summary.total - current.summary.blog),
                blog: 0
            }
            : { total: 0, chat: 0, blog: 0 };

    return { notifications, summary };
};

export const useNotificationsQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.notifications(scope.tenantKey),
        queryFn: ({ signal }) => getNotifications(100, signal),
        enabled: scope.enabled,
        staleTime: 10_000,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false
    });
};

export const useMarkNotificationReadMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (notificationId: string) => markNotificationRead(notificationId),
        onMutate: async (notificationId) => {
            const queryKey = queryKeys.notifications(scope.tenantKey);
            await queryClient.cancelQueries({ queryKey });
            queryClient.setQueryData<NotificationsResponse>(
                queryKey,
                (current) => markCachedNotificationRead(current, notificationId)
            );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.notifications(scope.tenantKey)
            });
        }
    });
};

export const useMarkNotificationsReadMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: (category?: NotificationCategory) => markNotificationsRead(category),
        onMutate: async (category) => {
            const queryKey = queryKeys.notifications(scope.tenantKey);
            await queryClient.cancelQueries({ queryKey });
            queryClient.setQueryData<NotificationsResponse>(
                queryKey,
                (current) => markCachedCategoryRead(current, category)
            );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.notifications(scope.tenantKey)
            });
        }
    });
};

export const groupNotificationsByCategory = (
    notifications: readonly AppNotification[]
): {
    readonly chat: readonly AppNotification[];
    readonly blog: readonly AppNotification[];
} => ({
    chat: notifications.filter((notification) => notification.category === 'CHAT'),
    blog: notifications.filter((notification) => notification.category === 'BLOG')
});
