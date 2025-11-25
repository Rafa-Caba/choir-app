import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GalleryScreen } from '../screens/gallery/GalleryScreen';
import { MediaDetailScreen } from '../screens/gallery/MediaDetailScreen';

const Stack = createNativeStackNavigator();

export const GalleryNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GalleryGrid" component={GalleryScreen} />
            <Stack.Screen 
                name="ImageDetail" 
                component={MediaDetailScreen} 
                options={{ presentation: 'fullScreenModal' }} 
            />
        </Stack.Navigator>
    );
};