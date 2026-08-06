// src/navigation/TabsNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { HomeNavigator } from './HomeNavigator';
import { ChatNavigator } from './ChatNavigator';
import { SongsNavigator } from './SongsNavigator';
import { GalleryNavigator } from './GalleryNavigator';
import { BlogNavigator } from './BlogNavigator';
import { SettingsNavigator } from './SettingsNavigator';

type TabsParamList = {
    readonly HomeTab: undefined;
    readonly ChatTab: undefined;
    readonly SongsTab: undefined;
    readonly GalleryTab: undefined;
    readonly BlogTab: undefined;
    readonly SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export const TabsNavigator = () => {
    const colors = useTheme().currentTheme;

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
