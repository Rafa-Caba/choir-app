// src/components/home/HomeQuickMenuModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
    groupNotificationsByCategory,
    useMarkNotificationReadMutation,
    useMarkNotificationsReadMutation,
    useNotificationsQuery
} from '../../hooks/query/useNotificationsData';
import type {
    AppNotification,
    NotificationCategory,
    NotificationType
} from '../../types/notification';

interface Props {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly onNavigateNotification: (
        category: NotificationCategory,
        resourceId: string
    ) => void;
}

type MenuView = 'MENU' | 'NOTIFICATIONS' | 'THEMES';

const getNotificationIcon = (
    type: NotificationType
): keyof typeof Ionicons.glyphMap => {
    switch (type) {
        case 'CHAT_MESSAGE':
            return 'chatbubble-ellipses-outline';
        case 'CHAT_REACTION':
            return 'heart-outline';
        case 'BLOG_POST':
            return 'document-text-outline';
        case 'BLOG_COMMENT':
            return 'chatbox-outline';
        case 'BLOG_REACTION':
            return 'heart-circle-outline';
    }
};

const formatNotificationTime = (value: string): string => {
    const date = new Date(value);
    const now = Date.now();
    const differenceMinutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000));

    if (differenceMinutes < 1) {
        return 'Ahora';
    }

    if (differenceMinutes < 60) {
        return `Hace ${differenceMinutes} min`;
    }

    const differenceHours = Math.floor(differenceMinutes / 60);

    if (differenceHours < 24) {
        return `Hace ${differenceHours} h`;
    }

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short'
    });
};

export const HomeQuickMenuModal = ({
    visible,
    onClose,
    onNavigateNotification
}: Props) => {
    const {
        currentTheme: colors,
        availableThemes,
        setThemeById,
        loading: themesLoading
    } = useTheme();
    const notificationsQuery = useNotificationsQuery();
    const markReadMutation = useMarkNotificationReadMutation();
    const markAllMutation = useMarkNotificationsReadMutation();
    const [view, setView] = useState<MenuView>('MENU');
    const [savingThemeId, setSavingThemeId] = useState<string | null>(null);
    const notifications = notificationsQuery.data?.notifications ?? [];
    const summary = notificationsQuery.data?.summary ?? { total: 0, chat: 0, blog: 0 };
    const grouped = useMemo(
        () => groupNotificationsByCategory(notifications),
        [notifications]
    );

    useEffect(() => {
        if (!visible) {
            setView('MENU');
            setSavingThemeId(null);
        }
    }, [visible]);

    const selectTheme = async (themeId: string): Promise<void> => {
        if (themeId === colors.id || savingThemeId) {
            return;
        }

        setSavingThemeId(themeId);

        try {
            await setThemeById(themeId);
        } catch {
            Alert.alert('Error', 'No fue posible cambiar el tema.');
        } finally {
            setSavingThemeId(null);
        }
    };

    const openNotification = (notification: AppNotification): void => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification.id);
        }

        onClose();
        onNavigateNotification(notification.category, notification.resourceId);
    };

    const renderNotificationSection = (
        title: string,
        category: NotificationCategory,
        items: readonly AppNotification[]
    ) => {
        if (items.length === 0) {
            return null;
        }

        return (
            <View style={styles.notificationSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textColor }]}>{title}</Text>
                    <TouchableOpacity
                        onPress={() => markAllMutation.mutate(category)}
                        disabled={markAllMutation.isPending}
                    >
                        <Text style={[styles.markReadText, { color: colors.primaryColor }]}>Marcar leído</Text>
                    </TouchableOpacity>
                </View>

                {items.map((notification) => (
                    <TouchableOpacity
                        key={notification.id}
                        style={[
                            styles.notificationRow,
                            {
                                backgroundColor: notification.isRead
                                    ? colors.cardColor
                                    : colors.backgroundColor,
                                borderColor: colors.borderColor
                            }
                        ]}
                        onPress={() => openNotification(notification)}
                        activeOpacity={0.78}
                    >
                        <View style={[styles.notificationIcon, { backgroundColor: colors.cardColor }]}>
                            <Ionicons
                                name={getNotificationIcon(notification.type)}
                                size={23}
                                color={colors.primaryColor}
                            />
                        </View>
                        <View style={styles.flexOne}>
                            <View style={styles.notificationTitleRow}>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.notificationTitle, { color: colors.textColor }]}
                                >
                                    {notification.title}
                                </Text>
                                {!notification.isRead && (
                                    <View style={[styles.unreadDot, { backgroundColor: colors.primaryColor }]} />
                                )}
                            </View>
                            <Text
                                numberOfLines={2}
                                style={[styles.notificationBody, { color: colors.secondaryTextColor }]}
                            >
                                {notification.body}
                            </Text>
                            <Text style={[styles.notificationTime, { color: colors.secondaryTextColor }]}> 
                                {formatNotificationTime(notification.createdAt)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[
                                styles.modal,
                                view === 'MENU' ? styles.menuModal : styles.expandedModal,
                                { backgroundColor: colors.cardColor }
                            ]}
                        >
                            <View style={styles.header}>
                                {view !== 'MENU' ? (
                                    <TouchableOpacity
                                        onPress={() => setView('MENU')}
                                        style={styles.headerAction}
                                    >
                                        <Ionicons name="arrow-back" size={24} color={colors.textColor} />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.headerAction} />
                                )}
                                <Text style={[styles.title, { color: colors.textColor }]}> 
                                    {view === 'MENU'
                                        ? 'Accesos rápidos'
                                        : view === 'NOTIFICATIONS'
                                            ? 'Notificaciones'
                                            : 'Apariencia y temas'}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.headerAction}>
                                    <Ionicons name="close" size={25} color={colors.textColor} />
                                </TouchableOpacity>
                            </View>

                            {view === 'MENU' && (
                                <View>
                                    <TouchableOpacity
                                        style={[styles.menuOption, { borderBottomColor: colors.borderColor }]}
                                        onPress={() => setView('NOTIFICATIONS')}
                                    >
                                        <View style={styles.menuOptionLeft}>
                                            <Ionicons name="notifications-outline" size={27} color={colors.primaryColor} />
                                            <View style={styles.menuOptionTextContainer}>
                                                <Text style={[styles.menuOptionTitle, { color: colors.textColor }]}>Notificaciones</Text>
                                                <Text style={[styles.menuOptionSubtitle, { color: colors.secondaryTextColor }]}>Chat, Blog, comentarios y reacciones</Text>
                                            </View>
                                        </View>
                                        <View style={styles.menuOptionRight}>
                                            {summary.total > 0 && (
                                                <View style={styles.badge}>
                                                    <Text style={styles.badgeText}>{Math.min(summary.total, 99)}</Text>
                                                </View>
                                            )}
                                            <Ionicons name="chevron-forward" size={22} color={colors.secondaryTextColor} />
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.menuOption}
                                        onPress={() => setView('THEMES')}
                                    >
                                        <View style={styles.menuOptionLeft}>
                                            <Ionicons name="color-palette-outline" size={27} color={colors.primaryColor} />
                                            <View style={styles.menuOptionTextContainer}>
                                                <Text style={[styles.menuOptionTitle, { color: colors.textColor }]}>Apariencia y temas</Text>
                                                <Text style={[styles.menuOptionSubtitle, { color: colors.secondaryTextColor }]}>Tema actual: {colors.name}</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={22} color={colors.secondaryTextColor} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {view === 'NOTIFICATIONS' && (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.scrollContent}
                                >
                                    <View style={styles.notificationsTopRow}>
                                        <Text style={[styles.notificationCount, { color: colors.secondaryTextColor }]}> 
                                            {summary.total} sin leer
                                        </Text>
                                        {summary.total > 0 && (
                                            <TouchableOpacity
                                                onPress={() => markAllMutation.mutate(undefined)}
                                                disabled={markAllMutation.isPending}
                                            >
                                                <Text style={[styles.markAllText, { color: colors.primaryColor }]}>Marcar todas</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {notificationsQuery.isLoading ? (
                                        <ActivityIndicator color={colors.primaryColor} style={styles.loading} />
                                    ) : notificationsQuery.isError ? (
                                        <View style={styles.emptyState}>
                                            <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No fue posible cargar las notificaciones.</Text>
                                            <TouchableOpacity
                                                style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                                                onPress={() => void notificationsQuery.refetch()}
                                            >
                                                <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : notifications.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Ionicons name="notifications-off-outline" size={42} color={colors.secondaryTextColor} />
                                            <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No hay notificaciones todavía.</Text>
                                        </View>
                                    ) : (
                                        <>
                                            {renderNotificationSection('Chat', 'CHAT', grouped.chat)}
                                            {renderNotificationSection('Blog', 'BLOG', grouped.blog)}
                                        </>
                                    )}
                                </ScrollView>
                            )}

                            {view === 'THEMES' && (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.themeList}
                                >
                                    {themesLoading ? (
                                        <ActivityIndicator color={colors.primaryColor} style={styles.loading} />
                                    ) : availableThemes.map((theme) => {
                                        const selected = theme.id === colors.id;
                                        const saving = theme.id === savingThemeId;

                                        return (
                                            <TouchableOpacity
                                                key={theme.id}
                                                style={[
                                                    styles.themeRow,
                                                    {
                                                        backgroundColor: theme.cardColor,
                                                        borderColor: selected
                                                            ? colors.primaryColor
                                                            : colors.borderColor,
                                                        borderWidth: selected ? 2 : 1
                                                    }
                                                ]}
                                                onPress={() => void selectTheme(theme.id)}
                                                disabled={savingThemeId !== null}
                                            >
                                                <View style={styles.flexOne}>
                                                    <Text style={[styles.themeName, { color: theme.textColor }]}>{theme.name}</Text>
                                                    <View style={styles.colorRow}>
                                                        <View style={[styles.colorDot, { backgroundColor: theme.primaryColor }]} />
                                                        <View style={[styles.colorDot, { backgroundColor: theme.accentColor }]} />
                                                        <View style={[styles.colorDot, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor, borderWidth: 1 }]} />
                                                    </View>
                                                </View>
                                                {saving ? (
                                                    <ActivityIndicator color={colors.primaryColor} />
                                                ) : selected ? (
                                                    <Ionicons name="checkmark-circle" size={26} color={colors.primaryColor} />
                                                ) : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    overlay: {
        flex: 1,
        alignItems: 'flex-end',
        paddingTop: 105,
        paddingHorizontal: 18,
        backgroundColor: 'rgba(0,0,0,0.38)'
    },
    modal: {
        width: '100%',
        borderRadius: 22,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12
    },
    menuModal: { maxWidth: 430 },
    expandedModal: { maxWidth: 560, maxHeight: '82%' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800' },
    menuOption: {
        minHeight: 82,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1
    },
    menuOptionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    menuOptionTextContainer: { flex: 1, marginLeft: 13 },
    menuOptionTitle: { fontSize: 17, fontWeight: '800' },
    menuOptionSubtitle: { fontSize: 12, marginTop: 3 },
    menuOptionRight: { flexDirection: 'row', alignItems: 'center' },
    badge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 6,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E53935'
    },
    badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
    scrollContent: { paddingBottom: 6 },
    notificationsTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    notificationCount: { fontSize: 13 },
    markAllText: { fontSize: 13, fontWeight: '800' },
    notificationSection: { marginBottom: 18 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    markReadText: { fontSize: 12, fontWeight: '700' },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 15,
        padding: 12,
        marginBottom: 8
    },
    notificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11
    },
    notificationTitleRow: { flexDirection: 'row', alignItems: 'center' },
    notificationTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
    notificationBody: { fontSize: 13, marginTop: 2 },
    notificationTime: { fontSize: 11, marginTop: 5 },
    loading: { marginVertical: 50 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyText: { textAlign: 'center', marginTop: 10 },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    themeList: { paddingBottom: 8 },
    themeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 15,
        marginBottom: 10
    },
    themeName: { fontSize: 17, fontWeight: '800' },
    colorRow: { flexDirection: 'row', marginTop: 9 },
    colorDot: { width: 22, height: 22, borderRadius: 11, marginRight: 7 }
});
