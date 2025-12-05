import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Stores & Services
import { useAuthStore } from './src/store/useAuthStore';
import { useAppConfigStore } from './src/store/useAppConfigStore';
import { useChatStore } from './src/store/useChatStore';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { updatePushToken } from './src/services/auth';

import { AppNavigator } from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push permissions not granted, skipping token registration.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (e: any) {
    if (e?.code === 'E_REGISTRATION_FAILED') {
      console.log(
        '🔕 Push registration failed (FCM not configured for native build). Skipping token.'
      );
      return null;
    }

    console.error('Error getting push token:', e);
    return null;
  }
}

const AppContent = ({ onReady }: { onReady: () => void }) => {
  const { checkAuth, user } = useAuthStore();
  const { fetchAppConfig } = useAppConfigStore();
  const { connect, disconnect } = useChatStore();
  const { currentTheme } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          checkAuth(),
          fetchAppConfig(),
        ]);
      } catch (e) {
        console.warn('App init error:', e);
      } finally {
        onReady();
      }
    }

    prepare();
  }, [checkAuth, fetchAppConfig, onReady]);

  useEffect(() => {
    if (user) {
      connect();

      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          console.log('🔔 Push Token:', token);
          updatePushToken(token);
        }
      });
    } else {
      disconnect();
    }
  }, [user, connect, disconnect]);

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
    MyRoboItalicFont: require('./assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    async function hideSplashIfReady() {
      if (appIsReady && fontsLoaded) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    }

    hideSplashIfReady();
  }, [appIsReady, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={styles.container}>
          <AppContent onReady={() => setAppIsReady(true)} />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
