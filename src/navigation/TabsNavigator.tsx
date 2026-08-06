// src/navigation/TabsNavigator.tsx

import React, { useEffect, useMemo, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { HomeNavigator, type HomeStackParamList } from './HomeNavigator';
import { ChatNavigator, type ChatStackParamList } from './ChatNavigator';
import { SongsNavigator } from './SongsNavigator';
import { GalleryNavigator } from './GalleryNavigator';
import { BlogNavigator, type BlogStackParamList } from './BlogNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { useNotificationsQuery } from '../hooks/query/useNotificationsData';
import { useMarkChatReceiptsMutation } from '../hooks/query/useChatData';

export type TabsParamList = {
    readonly HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
    readonly ChatTab: NavigatorScreenParams<ChatStackParamList> | undefined;
    readonly SongsTab: undefined;
    readonly GalleryTab: undefined;
    readonly BlogTab: NavigatorScreenParams<BlogStackParamList> | undefined;
    readonly SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export const TabsNavigator = () => {
    const colors = useTheme().currentTheme;
    const notificationsQuery = useNotificationsQuery();
    const deliveryMutation = useMarkChatReceiptsMutation();
    const pendingDeliveryKeyRef = useRef('');
    const chatBadge = notificationsQuery.data?.summary.chat ?? 0;
    const blogBadge = notificationsQuery.data?.summary.blog ?? 0;
    const pendingDeliveryMessageIds = useMemo(
        () => [...new Set(
            (notificationsQuery.data?.notifications ?? [])
                .filter((notification) =>
                    !notification.isRead && notification.type === 'CHAT_MESSAGE'
                )
                .map((notification) => notification.resourceId)
                .filter(Boolean)
        )],
        [notificationsQuery.data?.notifications]
    );
    const pendingDeliveryKey = pendingDeliveryMessageIds.join(':');

    useEffect(() => {
        if (
            !pendingDeliveryKey ||
            deliveryMutation.isPending ||
            pendingDeliveryKeyRef.current === pendingDeliveryKey
        ) {
            return;
        }

        pendingDeliveryKeyRef.current = pendingDeliveryKey;
        deliveryMutation.mutate(
            { messageIds: pendingDeliveryMessageIds, status: 'DELIVERED' },
            {
                onError: () => {
                    pendingDeliveryKeyRef.current = '';
                }
            }
        );
    }, [deliveryMutation, pendingDeliveryKey, pendingDeliveryMessageIds]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: colors.primaryColor,
                tabBarInactiveTintColor: colors.secondaryTextColor || '#888888',
                tabBarStyle: {
                    backgroundColor: colors.navColor,
                    borderTopColor: colors.borderColor || 'transparent',
                    borderTopWidth: 1,
                    elevation: 0,
                    height: 80,
                    paddingTop: 5,
                    paddingBottom: 20
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 5
                },
                tabBarBadge: route.name === 'ChatTab'
                    ? chatBadge > 0 ? Math.min(chatBadge, 99) : undefined
                    : route.name === 'BlogTab'
                        ? blogBadge > 0 ? Math.min(blogBadge, 99) : undefined
                        : undefined,
                tabBarBadgeStyle: {
                    backgroundColor: '#E53935',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: '800'
                },
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'ChatTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'SongsTab') iconName = focused ? 'musical-notes' : 'musical-notes-outline';
                    else if (route.name === 'GalleryTab') iconName = focused ? 'images' : 'images-outline';
                    else if (route.name === 'BlogTab') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                }
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
            <Tab.Screen name="ChatTab" component={ChatNavigator} options={{ title: 'Chat' }} />
            <Tab.Screen name="SongsTab" component={SongsNavigator} options={{ title: 'Cantos' }} />
            <Tab.Screen name="GalleryTab" component={GalleryNavigator} options={{ title: 'Galería' }} />
            <Tab.Screen name="BlogTab" component={BlogNavigator} options={{ title: 'Blog' }} />
            <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'Ajustes' }} />
        </Tab.Navigator>
    );
};
