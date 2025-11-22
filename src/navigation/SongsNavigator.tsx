import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SongTypesScreen } from '../screens/songs/SongTypesScreen';
import { SongsListScreen } from '../screens/songs/SongsListScreen';
import { SongDetailScreen } from '../screens/songs/SongDetailScreen';
import { CreateSongScreen } from '../screens/songs/CreateSongScreen';

export type SongsStackParamList = {
    SongTypes: undefined;
    SongsListScreen: { typeId: number, typeName: string };
    SongDetailScreen: { songId: number };
    CreateSongScreen: undefined;
};

const Stack = createNativeStackNavigator<SongsStackParamList>();

export const SongsNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: '#8B4BFF',
                headerTitleStyle: { color: 'black' },
                contentStyle: { backgroundColor: 'white' }
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
                component={CreateSongScreen} 
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};