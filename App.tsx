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
import { QueryProvider } from './src/providers/QueryProvider';
import { QueryLifecycleManager } from './src/providers/QueryLifecycleManager';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useAppConfigStore } from './src/store/useAppConfigStore';
import { useAuthStore } from './src/store/useAuthStore';
import { useTenantQueryScope } from './src/hooks/query/useTenantQueryScope';

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
    const currentTheme = useTheme().currentTheme;
    const tenantScope = useTenantQueryScope();

    usePushNotifications();

    useEffect(() => {
        checkAuth()
            .catch(() => undefined)
            .finally(onReady);
    }, [checkAuth, onReady]);

    useEffect(() => {
        if (status === 'authenticated' && !requiresPasswordChange && tenantScope.enabled) {
            fetchAppConfig().catch(() => undefined);
        }
    }, [fetchAppConfig, requiresPasswordChange, status, tenantScope.enabled, tenantScope.tenantKey]);

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
            <QueryProvider>
                <QueryLifecycleManager>
                    <ThemeProvider>
                        <View style={styles.container}>
                            <AppContent onReady={handleReady} />
                        </View>
                    </ThemeProvider>
                </QueryLifecycleManager>
            </QueryProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    }
});
