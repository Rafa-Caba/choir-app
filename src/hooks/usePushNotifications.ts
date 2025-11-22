import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                console.log("✅ Token Generated:", token);
                setExpoPushToken(token);
            }
        });
    }, []);

    return { expoPushToken };
};

async function registerForPushNotificationsAsync() {
  let token;

  // 1. Handle Android Channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 2. Handle Web (Prevent Crash)
  if (Platform.OS === 'web') {
      console.log("⚠️ Web Push requires VAPID keys. Returning fake token for testing.");
      return "ExponentPushToken[WEB_TEST_TOKEN]";
  }

  // 3. Handle Physical Device vs Simulator
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    // Get the REAL token
    // Ensure projectId is set in app.json, or handle gracefully
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log("Error getting token:", e);
    }
  } else {
    // 4. Handle Simulator (The Fix for you right now!)
    console.log('📱 Running on Simulator: Generating Fake Token for API Test');
    return "ExponentPushToken[SIMULATOR_TEST_TOKEN]";
  }

  return token;
}