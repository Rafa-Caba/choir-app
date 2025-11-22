import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateAnnouncementScreen } from '../screens/CreateAnnouncementScreen';

// Define what params each screen receives (undefined = no params)
export type HomeStackParamList = {
    HomeScreen: undefined;
    CreateAnnouncement: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

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
                component={CreateAnnouncementScreen} 
                options={{ headerShown: true, title: 'Nuevo Aviso', headerTintColor: '#8B4BFF' }}
            />
        </Stack.Navigator>
    );
};