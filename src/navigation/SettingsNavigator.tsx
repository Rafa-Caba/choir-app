import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen'; 
import { EditProfileScreen } from '../screens/settings/EditProfileScreen';
import { UsersListScreen } from '../screens/admin/UsersListScreen';
import { ManageUserScreen } from '../screens/admin/ManageUserScreen';
import { ThemeSelectionScreen } from '../screens/settings/ThemeSelectionScreen';
import { MediaDetailScreen } from '../screens/gallery/MediaDetailScreen';
import { AdminThemeEditorScreen } from '../screens/settings/AdminThemeEditorScreen';
import { useTheme } from '../context/ThemeContext';
import { AdminSettingsScreen } from '../screens/settings/AdminSettingsScreen';

export type SettingsStackParamList = {
    SettingsScreen: undefined;
    PerfilScreen: undefined;
    EditarPerfilScreen: undefined;
    UsersListScreen: undefined;
    ManageUserScreen: undefined;
    ThemeSelectionScreen: undefined;
    AdminThemeEditor: undefined;
    MediaDetailScreen: undefined;
    AdminSettingsScreen: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background, 
                },
                headerShadowVisible: false,

                headerTintColor: colors.text, 
                headerTitleStyle: { 
                    color: colors.text,
                    fontWeight: 'bold'
                },

                contentStyle: { backgroundColor: colors.background }
            }}
        >
            <Stack.Screen 
                name="SettingsScreen" 
                component={SettingsScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="PerfilScreen" 
                component={ProfileScreen} 
                options={{ title: 'Mi Perfil' }} 
            />
            <Stack.Screen 
                name="EditarPerfilScreen" 
                component={EditProfileScreen} 
                options={{ title: 'Editar Perfil' }} 
            />
            <Stack.Screen 
                name="UsersListScreen" 
                component={UsersListScreen} 
                options={{ title: 'Usuarios' }} 
            />
            <Stack.Screen 
                name="ManageUserScreen" 
                component={ManageUserScreen} 
                options={{ title: 'Gestión' }} 
            />
            <Stack.Screen 
                name="ThemeSelectionScreen" 
                component={ThemeSelectionScreen} 
                options={{ title: 'Temas de la App' }} 
            />
            <Stack.Screen 
                name="AdminThemeEditor" 
                component={AdminThemeEditorScreen} 
                options={{ title: 'Editor de Temas' }} 
            />
            <Stack.Screen 
                name="MediaDetailScreen" 
                component={MediaDetailScreen} 
                options={{ presentation: 'fullScreenModal', headerShown: false }} 
            />
            <Stack.Screen 
                name="AdminSettingsScreen" 
                component={AdminSettingsScreen} 
                options={{ title: 'Configuración de la App' }}
            />
        </Stack.Navigator>
    );
};