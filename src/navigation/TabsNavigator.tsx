import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Navigators
import { HomeNavigator } from './HomeNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { SongsNavigator } from './SongsNavigator';
import { GalleryNavigator } from './GalleryNavigator';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { BlogNavigator } from './BlogNavigator';

const Tab = createBottomTabNavigator();

export const TabsNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#8B4BFF',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 65,
                    paddingBottom: 10
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
                },
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
            <Tab.Screen name="ChatTab" component={ChatScreen} options={{ title: 'Chat' }} />
            <Tab.Screen name="SongsTab" component={SongsNavigator} options={{ title: 'Cantos' }} />
            <Tab.Screen name="GalleryTab" component={GalleryNavigator} options={{ title: 'Galería' }} />
            <Tab.Screen name="BlogTab" component={BlogNavigator} options={{ title: 'BLOG' }} />
            <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'Ajustes' }} />
        </Tab.Navigator>
    );
};