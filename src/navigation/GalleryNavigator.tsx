// src/navigation/GalleryNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GalleryScreen } from '../screens/gallery/GalleryScreen';
import { MediaDetailScreen } from '../screens/gallery/MediaDetailScreen';
import type { GalleryImage } from '../types/gallery';

export type GalleryStackParamList = {
    GalleryGrid: undefined;
    MediaDetailScreen: { readonly media: GalleryImage };
};

const Stack = createNativeStackNavigator<GalleryStackParamList>();

export const GalleryNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GalleryGrid" component={GalleryScreen} />
            <Stack.Screen
                name="MediaDetailScreen"
                component={MediaDetailScreen}
                options={{ presentation: 'fullScreenModal' }}
            />
        </Stack.Navigator>
    );
};