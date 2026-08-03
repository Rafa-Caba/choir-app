// src/navigation/SettingsNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { canManageSettings, canManageUsers, canViewAuditLogs } from '../auth/permissions';
import { AccessDeniedScreen } from '../components/auth/AccessDeniedScreen';
import { useTheme } from '../context/ThemeContext';
import { AuditLogsScreen } from '../screens/audit/AuditLogsScreen';
import { ManageUserScreen } from '../screens/admin/ManageUserScreen';
import { UsersListScreen } from '../screens/admin/UsersListScreen';
import { MediaDetailScreen } from '../screens/gallery/MediaDetailScreen';
import { AdminSettingsScreen } from '../screens/settings/AdminSettingsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { EditProfileScreen } from '../screens/settings/profile/EditProfileScreen';
import { ProfileScreen } from '../screens/settings/profile/ProfileScreen';
import { ManageThemeScreen } from '../screens/settings/themes/ManageThemeScreen';
import { ThemeSelectionScreen } from '../screens/settings/themes/ThemeSelectionScreen';
import { ThemesListScreen } from '../screens/settings/themes/ThemesListScreen';
import { useAuthStore } from '../store/useAuthStore';
import type { AuditScope } from '../types/audit';
import type { User } from '../types/auth';
import type { GalleryImage } from '../types/gallery';
import type { Theme } from '../types/theme';

export type SettingsStackParamList = {
    SettingsScreen: undefined;
    PerfilScreen: undefined;
    EditarPerfilScreen: undefined;
    ThemeSelectionScreen: undefined;
    AdminSettingsScreen: undefined;
    UsersListScreen: undefined;
    ManageUserScreen: { readonly user?: User } | undefined;
    ThemesListScreen: undefined;
    ManageThemeScreen: { readonly themeToEdit?: Theme } | undefined;
    AuditLogsScreen: { readonly scope?: AuditScope } | undefined;
    MediaDetailScreen: { readonly media: GalleryImage };
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsManagementGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canManageSettings(role) ? <AdminSettingsScreen /> : <AccessDeniedScreen />;
};

const ThemesManagementGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canManageSettings(role) ? <ThemesListScreen /> : <AccessDeniedScreen />;
};

const ThemeEditorGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canManageSettings(role) ? <ManageThemeScreen /> : <AccessDeniedScreen />;
};

const AuditGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canViewAuditLogs(role) ? <AuditLogsScreen /> : <AccessDeniedScreen />;
};

export const SettingsNavigator = () => {
    const colors = useTheme().currentTheme;
    const role = useAuthStore((state) => state.user?.role);
    const showUserManagement = canManageUsers(role);
    const showSettingsManagement = canManageSettings(role);
    const showAudit = canViewAuditLogs(role);

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
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PerfilScreen" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
            <Stack.Screen name="EditarPerfilScreen" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
            <Stack.Screen name="ThemeSelectionScreen" component={ThemeSelectionScreen} options={{ title: 'Temas' }} />

            {showUserManagement && (
                <>
                    <Stack.Screen name="UsersListScreen" component={UsersListScreen} options={{ title: 'Usuarios' }} />
                    <Stack.Screen name="ManageUserScreen" component={ManageUserScreen} options={{ title: 'Gestión de usuario' }} />
                </>
            )}

            {showSettingsManagement && (
                <>
                    <Stack.Screen name="ThemesListScreen" component={ThemesManagementGuard} options={{ title: 'Gestión de temas' }} />
                    <Stack.Screen name="ManageThemeScreen" component={ThemeEditorGuard} options={{ title: 'Editor de tema' }} />
                    <Stack.Screen name="AdminSettingsScreen" component={SettingsManagementGuard} options={{ title: 'Configuración' }} />
                </>
            )}

            {showAudit && (
                <Stack.Screen name="AuditLogsScreen" component={AuditGuard} options={{ title: 'Auditoría' }} />
            )}

            <Stack.Screen
                name="MediaDetailScreen"
                component={MediaDetailScreen}
                options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
        </Stack.Navigator>
    );
};
