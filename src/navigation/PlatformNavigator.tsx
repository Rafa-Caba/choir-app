// src/navigation/PlatformNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccessDeniedScreen } from '../components/auth/AccessDeniedScreen';
import { useTheme } from '../context/ThemeContext';
import { AuditLogsScreen } from '../screens/audit/AuditLogsScreen';
import { ManageUserScreen } from '../screens/admin/ManageUserScreen';
import { UsersListScreen } from '../screens/admin/UsersListScreen';
import { ChoirsListScreen } from '../screens/choir/ChoirsListScreen';
import { ManageChoirScreen } from '../screens/choir/ManageChoirScreen';
import { useAuthStore } from '../store/useAuthStore';
import type { AuditScope } from '../types/audit';
import type { User } from '../types/auth';

export type PlatformStackParamList = {
    ChoirsListScreen: undefined;
    ManageChoirScreen: { readonly choirId?: string } | undefined;
    UsersListScreen: undefined;
    ManageUserScreen: { readonly user?: User } | undefined;
    AuditLogsScreen: { readonly scope?: AuditScope } | undefined;
};

const Stack = createNativeStackNavigator<PlatformStackParamList>();

export const PlatformNavigator = () => {
    const colors = useTheme().currentTheme;
    const user = useAuthStore((state) => state.user);

    if (user?.role !== 'SUPER_ADMIN') {
        return <AccessDeniedScreen showBackButton={false} />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.backgroundColor },
                headerShadowVisible: false,
                headerTintColor: colors.textColor,
                headerTitleStyle: { color: colors.textColor, fontWeight: '800' },
                contentStyle: { backgroundColor: colors.backgroundColor }
            }}
        >
            <Stack.Screen
                name="ChoirsListScreen"
                component={ChoirsListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ManageChoirScreen"
                component={ManageChoirScreen}
                options={{ title: 'Gestión de coro' }}
            />
            <Stack.Screen
                name="UsersListScreen"
                component={UsersListScreen}
                options={{ title: 'Usuarios del coro' }}
            />
            <Stack.Screen
                name="ManageUserScreen"
                component={ManageUserScreen}
                options={{ title: 'Gestión de usuario' }}
            />
            <Stack.Screen
                name="AuditLogsScreen"
                component={AuditLogsScreen}
                options={{ title: 'Auditoría' }}
            />
        </Stack.Navigator>
    );
};
