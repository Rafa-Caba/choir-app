// src/navigation/HomeNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateAnnouncementScreen } from '../screens/CreateAnnouncementScreen';
import { canManageContent } from '../auth/permissions';
import { AccessDeniedScreen } from '../components/auth/AccessDeniedScreen';
import { useAuthStore } from '../store/useAuthStore';

// Define what params each screen receives (undefined = no params)
export type HomeStackParamList = {
    HomeScreen: undefined;
    CreateAnnouncement: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const CreateAnnouncementGuard = () => {
    const role = useAuthStore((state) => state.user?.role);
    return canManageContent(role) ? <CreateAnnouncementScreen /> : <AccessDeniedScreen />;
};

export const HomeNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false, // We use custom headers or the screen handles it
                contentStyle: { backgroundColor: 'white' }
            }}
        >
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen 
                name="CreateAnnouncement" 
                component={CreateAnnouncementGuard} 
                options={{ headerShown: true, title: 'Nuevo Aviso', headerTintColor: '#8B4BFF' }}
            />
        </Stack.Navigator>
    );
};