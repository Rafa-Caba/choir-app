import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}