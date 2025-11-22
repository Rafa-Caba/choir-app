import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GalleryScreen } from '../screens/gallery/GalleryScreen';
import { ImageDetailScreen } from '../screens/gallery/ImageDetailScreen';

const Stack = createNativeStackNavigator();

export const GalleryNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GalleryGrid" component={GalleryScreen} />
            <Stack.Screen 
                name="ImageDetail" 
                component={ImageDetailScreen} 
                options={{ presentation: 'fullScreenModal' }} 
            />
        </Stack.Navigator>
    );
};