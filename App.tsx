// App.tsx

import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useAppConfigStore } from './src/store/useAppConfigStore';
import { useAuthStore } from './src/store/useAuthStore';
import { useChatStore } from './src/store/useChatStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false
    })
});

interface AppContentProps {
    readonly onReady: () => void;
}

const AppContent = ({ onReady }: AppContentProps) => {
    const status = useAuthStore((state) => state.status);
    const requiresPasswordChange = useAuthStore((state) => state.requiresPasswordChange);
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const fetchAppConfig = useAppConfigStore((state) => state.fetchAppConfig);
    const connect = useChatStore((state) => state.connect);
    const disconnect = useChatStore((state) => state.disconnect);
    const currentTheme = useTheme().currentTheme;

    usePushNotifications();

    useEffect(() => {
        checkAuth()
            .catch(() => undefined)
            .finally(onReady);
    }, [checkAuth, onReady]);

    useEffect(() => {
        if (status === 'authenticated' && !requiresPasswordChange) {
            fetchAppConfig().catch(() => undefined);
            connect();
            return disconnect;
        }

        disconnect();
        return undefined;
    }, [connect, disconnect, fetchAppConfig, requiresPasswordChange, status]);

    return (
        <NavigationContainer>
            <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
            <AppNavigator />
        </NavigationContainer>
    );
};

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [fontsLoaded] = useFonts({
        MyCustomFont: require('./assets/fonts/Pacifico-Regular.ttf'),
        MyRoboFont: require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
        MyRoboItalicFont: require('./assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf')
    });
    const handleReady = useCallback(() => setAppIsReady(true), []);

    useEffect(() => {
        if (appIsReady && fontsLoaded) {
            SplashScreen.hideAsync().catch(() => undefined);
        }
    }, [appIsReady, fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <View style={styles.container}>
                    <AppContent onReady={handleReady} />
                </View>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    }
});
