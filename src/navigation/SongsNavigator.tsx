// src/navigation/SongsNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SongTypesScreen } from '../screens/songs/SongTypesScreen';
import { SongsListScreen } from '../screens/songs/SongsListScreen';
import { SongDetailScreen } from '../screens/songs/SongDetailScreen';
import { CreateSongScreen } from '../screens/songs/CreateSongScreen';

import { useTheme } from '../context/ThemeContext';
import { canManageContent } from '../auth/permissions';
import { AccessDeniedScreen } from '../components/auth/AccessDeniedScreen';
import { useAuthStore } from '../store/useAuthStore';

export type SongsStackParamList = {
    SongTypes: undefined;
    SongsListScreen: { typeId: number, typeName: string };
    SongDetailScreen: { songId: number };
    CreateSongScreen: undefined;
};

const Stack = createNativeStackNavigator<SongsStackParamList>();

const CreateSongGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canManageContent(role) ? <CreateSongScreen /> : <AccessDeniedScreen />;
};

export const SongsNavigator = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.backgroundColor,
                },
                headerShadowVisible: false,

                headerTintColor: colors.textColor,
                headerTitleStyle: {
                    color: colors.textColor,
                    fontWeight: 'bold'
                },

                contentStyle: { backgroundColor: colors.backgroundColor }
            }}
        >
            <Stack.Screen
                name="SongTypes"
                component={SongTypesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SongsListScreen"
                component={SongsListScreen}
                options={({ route }) => ({ title: route.params.typeName })}
            />
            <Stack.Screen
                name="SongDetailScreen"
                component={SongDetailScreen}
                options={{ title: 'Detalle' }}
            />
            <Stack.Screen
                name="CreateSongScreen"
                component={CreateSongGuard}
                options={{ title: 'Detalles del Canto' }}
            />
        </Stack.Navigator>
    );
};