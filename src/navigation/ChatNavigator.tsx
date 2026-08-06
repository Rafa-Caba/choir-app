// src/navigation/ChatNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { ChatMediaScreen } from '../screens/chat/ChatMediaScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

export type ChatStackParamList = {
    ChatScreen: undefined;
    ChatMediaScreen: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatNavigator = () => {
    const colors = useTheme().currentTheme;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.backgroundColor },
                headerShadowVisible: false,
                headerTintColor: colors.textColor,
                headerTitleStyle: { color: colors.textColor, fontWeight: 'bold' },
                contentStyle: { backgroundColor: colors.backgroundColor }
            }}
        >
            <Stack.Screen
                name="ChatScreen"
                component={ChatScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ChatMediaScreen"
                component={ChatMediaScreen}
                options={{ title: 'Multimedia y archivos' }}
            />
        </Stack.Navigator>
    );
};
