import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // 1. Import Hook

// Navigators & Screens
import { HomeNavigator } from './HomeNavigator';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { SongsNavigator } from './SongsNavigator';
import { GalleryNavigator } from './GalleryNavigator';
import { BlogNavigator } from './BlogNavigator';
import { SettingsNavigator } from './SettingsNavigator';

const Tab = createBottomTabNavigator();

export const TabsNavigator = () => {
    // Get Current Theme Colors
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                
                // 3. Dynamic Colors
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary, // or 'gray' if you prefer
                tabBarStyle: {
                    backgroundColor: colors.navBg, // The background of the bar itself
                    borderTopColor: colors.border, // The thin line on top
                    borderTopWidth: 1,
                    elevation: 0,
                    height: 70,
                    paddingTop: 5,
                    paddingBottom: 8
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 5,
                    // You can also set dynamic font weight here if needed
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
            <Tab.Screen name="BlogTab" component={BlogNavigator} options={{ title: 'Blog' }} />
            <Tab.Screen name="SettingsTab" component={SettingsNavigator} options={{ title: 'Ajustes' }} />
        </Tab.Navigator>
    );
};