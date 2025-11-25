import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { useAppConfigStore } from './src/store/useAppConfigStore';
import { ThemeProvider } from './src/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  const { checkAuth } = useAuthStore();
  const { fetchAppConfig } = useAppConfigStore();

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('./assets/fonts/Pacifico-Regular.ttf'),
    'MyRoboFont': require('./assets/fonts/Roboto-VariableFont_wdth,wght.ttf'),
    'MyRoboItalicFont': require('./assets/fonts/Roboto-Italic-VariableFont_wdth,wght.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          checkAuth(),    
          fetchAppConfig()  
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);
  
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <NavigationContainer>
          {/* <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" /> */}
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </View>
  );
}