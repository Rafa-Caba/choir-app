import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/settings/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/settings/profile/EditProfileScreen';
import { ThemeSelectionScreen } from '../screens/settings/themes/ThemeSelectionScreen';
import { MediaDetailScreen } from '../screens/gallery/MediaDetailScreen';
import { AdminSettingsScreen } from '../screens/settings/AdminSettingsScreen';

// Admin Screens
import { UsersListScreen } from '../screens/admin/UsersListScreen';
import { ManageUserScreen } from '../screens/admin/ManageUserScreen';
import { ThemesListScreen } from '../screens/settings/themes/ThemesListScreen';
import { ManageThemeScreen } from '../screens/settings/themes/ManageThemeScreen';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types/auth';
import { Theme } from '../types/theme';

export type SettingsStackParamList = {
    SettingsScreen: undefined;
    PerfilScreen: undefined;
    EditarPerfilScreen: undefined;
    ThemeSelectionScreen: undefined;
    AdminSettingsScreen: undefined;

    // Admin Routes with Params
    UsersListScreen: undefined;
    ManageUserScreen: { user?: User } | undefined;

    ThemesListScreen: undefined;
    ManageThemeScreen: { themeToEdit?: Theme } | undefined;

    MediaDetailScreen: { media: any };
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

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

            {/* User Profile */}
            <Stack.Screen name="PerfilScreen" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
            <Stack.Screen name="EditarPerfilScreen" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />

            {/* Themes User */}
            <Stack.Screen name="ThemeSelectionScreen" component={ThemeSelectionScreen} options={{ title: 'Temas' }} />

            {/* Admin Users */}
            <Stack.Screen name="UsersListScreen" component={UsersListScreen} options={{ title: 'Usuarios' }} />
            <Stack.Screen name="ManageUserScreen" component={ManageUserScreen} options={{ title: 'Gestión Usuario' }} />

            {/* Admin Themes */}
            <Stack.Screen name="ThemesListScreen" component={ThemesListScreen} options={{ title: 'Gestión Temas' }} />
            <Stack.Screen name="ManageThemeScreen" component={ManageThemeScreen} options={{ title: 'Editor de Tema' }} />

            {/* App Config */}
            <Stack.Screen name="AdminSettingsScreen" component={AdminSettingsScreen} options={{ title: 'Configuración' }} />

            {/* Shared */}
            <Stack.Screen
                name="MediaDetailScreen"
                component={MediaDetailScreen}
                options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
        </Stack.Navigator>
    );
};