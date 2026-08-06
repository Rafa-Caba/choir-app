// src/screens/HomeScreen.tsx

import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { AnnouncementCard } from '../components/AnnouncementCard';
import type { Announcement } from '../types/announcement';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import type { TabsParamList } from '../navigation/TabsNavigator';
import {
    useAnnouncementsQuery,
    useDeleteAnnouncementMutation
} from '../hooks/query/useAnnouncementData';
import { useNotificationsQuery } from '../hooks/query/useNotificationsData';
import { HomeQuickMenuModal } from '../components/home/HomeQuickMenuModal';
import type { NotificationCategory } from '../types/notification';

type DrawerRoutes = {
    readonly Root: undefined;
};

type HomeNavigation = CompositeNavigationProp<
    NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>,
    DrawerNavigationProp<DrawerRoutes>
>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeNavigation>();
    const colors = useTheme().currentTheme;
    const [quickMenuVisible, setQuickMenuVisible] = useState(false);
    const user = useAuthStore((state) => state.user);
    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    const announcementsQuery = useAnnouncementsQuery(canEdit ? 'all' : 'public');
    const deleteMutation = useDeleteAnnouncementMutation();
    const announcements = announcementsQuery.data ?? [];
    const notificationsQuery = useNotificationsQuery();
    const unreadCount = notificationsQuery.data?.summary.total ?? 0;

    const handleDelete = (id: string): void => {
        const remove = (): void => {
            deleteMutation.mutate(id, {
                onError: () => Alert.alert('Error', 'No fue posible eliminar el aviso.')
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Eliminar este aviso?')) {
                remove();
            }
            return;
        }

        Alert.alert('Eliminar aviso', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: remove }
        ]);
    };

    const navigateFromNotification = (
        category: NotificationCategory,
        resourceId: string
    ): void => {
        const tabsNavigation = navigation.getParent<BottomTabNavigationProp<TabsParamList>>();

        if (category === 'CHAT') {
            tabsNavigation?.navigate('ChatTab', {
                screen: 'ChatScreen',
                params: { focusMessageId: resourceId }
            });
            return;
        }

        tabsNavigation?.navigate('BlogTab', {
            screen: 'BlogDetail',
            params: { postId: resourceId }
        });
    };

    const renderAnnouncement = ({ item }: { readonly item: Announcement }) => (
        <AnnouncementCard
            announcement={item}
            onPress={() => {
                if (canEdit) {
                    navigation.navigate('CreateAnnouncement', { announcement: item });
                }
            }}
            onDelete={canEdit ? () => handleDelete(item.id) : undefined}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.secondaryTextColor }]}>Hola,</Text>
                    <Text style={[styles.name, { color: colors.textColor }]}>{user?.name || 'Usuario'}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setQuickMenuVisible(true)}
                    activeOpacity={0.82}
                    accessibilityLabel="Abrir accesos rápidos"
                >
                    <View>
                        <Image
                            source={{ uri: user?.cachedImageUrl ?? user?.imageUrl ?? 'https://via.placeholder.com/100' }}
                            style={[styles.avatar, { borderColor: colors.primaryColor }]}
                        />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{Math.min(unreadCount, 99)}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <HomeQuickMenuModal
                visible={quickMenuVisible}
                onClose={() => setQuickMenuVisible(false)}
                onNavigateNotification={navigateFromNotification}
            />

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textColor }]}>Avisos</Text>
                {canEdit && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                        onPress={() => navigation.navigate('CreateAnnouncement')}
                    >
                        <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>+ Nuevo</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={announcements}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
                refreshing={announcementsQuery.isRefetching}
                onRefresh={() => void announcementsQuery.refetch()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={announcementsQuery.isLoading ? (
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>Cargando avisos...</Text>
                ) : announcementsQuery.isError ? (
                    <View style={styles.errorState}>
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No fue posible cargar los avisos.</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void announcementsQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No hay avisos recientes.</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 5 },
    greeting: { fontSize: 16 },
    name: { fontSize: 22, fontWeight: 'bold' },
    avatar: { width: 75, height: 75, borderRadius: 50, borderWidth: 2 },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E53935',
        borderWidth: 2,
        borderColor: '#ffffff'
    },
    notificationBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold' },
    addButton: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    addButtonText: { fontWeight: '600', fontSize: 14 },
    listContent: { paddingBottom: 20, flexGrow: 1 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
    errorState: { alignItems: 'center' },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }
});
