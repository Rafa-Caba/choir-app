import React, { useEffect } from 'react';
import { useWindowDimensions, View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons as Icon } from '@expo/vector-icons';

// Stores & Context
import { useAuthStore } from '../store/useAuthStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useTheme } from '../context/ThemeContext';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoadingScreen } from '../screens/LoadingScreen';

import { TabsNavigator } from './TabsNavigator';
import { updatePushToken } from '../services/auth';
import { useChatStore } from '../store/useChatStore';
import { useAppConfigStore } from '../store/useAppConfigStore';

const Drawer = createDrawerNavigator();

export const AppNavigator = () => {
    const { status, checkAuth } = useAuthStore();
    const { expoPushToken } = usePushNotifications();
    const { width } = useWindowDimensions();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (status === 'authenticated' && expoPushToken) {
            updatePushToken(expoPushToken);
        }
    }, [status, expoPushToken]);

    if (status === 'checking') return <LoadingScreen />;

    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: true,
                drawerType: width >= 768 ? 'permanent' : 'front',
                drawerStyle: {
                    width: 250,
                    backgroundColor: colors.navColor
                },
                headerTintColor: colors.primaryColor,
                headerStyle: {
                    backgroundColor: colors.navColor,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderColor || 'transparent'
                },
                headerTitleStyle: {
                    color: colors.textColor
                }
            }}
            drawerContent={(props) => <MenuInterno {...props} />}
        >
            {status !== 'authenticated' ? (
                <>
                    <Drawer.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
                    <Drawer.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                </>
            ) : (
                <>
                    <Drawer.Screen
                        name="Root"
                        component={TabsNavigator}
                        options={{
                            title: 'Inicio',
                            headerTitle: (props) => <HeaderWithLogo title="Inicio" tintColor={props.tintColor} />
                        }}
                    />
                </>
            )}
        </Drawer.Navigator>
    );
};

const MenuInterno = ({ navigation }: DrawerContentComponentProps) => {
    const { user, logout } = useAuthStore();
    const { connected } = useChatStore();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    return (
        <DrawerContentScrollView style={{ backgroundColor: colors.navColor }}>
            {/* Avatar Container */}
            <View style={styles.profileHeader}>
                <View>
                    <Image
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: connected ? '#4CAF50' : '#BDBDBD', borderColor: colors.backgroundColor }
                    ]} />
                </View>
                <Text style={[styles.name, { color: colors.textColor }]}>{user?.name || 'Guest'}</Text>
                <Text style={[styles.username, { color: colors.secondaryTextColor }]}>@{user?.username}</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuContainer}>
                <MenuItem
                    icon="home-outline"
                    text="Home"
                    color={colors.primaryColor}
                    textColor={colors.textColor}
                    onPress={() => navigation.navigate('Root', {
                        screen: 'HomeTab',
                        params: { screen: 'HomeScreen' }
                    })}
                />
                <MenuItem
                    icon="person-outline"
                    text="Perfil"
                    color={colors.primaryColor}
                    textColor={colors.textColor}
                    onPress={() => navigation.navigate('Root', {
                        screen: 'SettingsTab',
                        params: { screen: 'PerfilScreen' }
                    })}
                />

                <View style={[styles.separator, { backgroundColor: colors.borderColor || '#ccc' }]} />

                <MenuItem
                    icon="log-out-outline"
                    text="Cerrar Sesión"
                    onPress={logout}
                    color="#e74c3c"
                    textColor="#e74c3c"
                />
            </View>
        </DrawerContentScrollView>
    );
};

const MenuItem = ({ icon, text, onPress, color, textColor }: any) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress}>
        <Icon name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
);

const HeaderWithLogo = ({ title, tintColor }: { title: string, tintColor?: string }) => {
    const { appLogoUrl } = useAppConfigStore();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
                source={appLogoUrl ? { uri: appLogoUrl } : require('../../assets/icon.png')}
                style={{ width: 30, height: 30, borderRadius: 8, marginRight: 10 }}
                resizeMode="contain"
            />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: tintColor }}>
                {title}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    profileHeader: { padding: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
    statusDot: {
        position: 'absolute', bottom: 0, left: 70,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2
    },
    name: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    username: {
        fontSize: 14,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 100,
        borderWidth: 3,
    },
    menuContainer: {
        marginHorizontal: 20
    },
    menuBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10
    },
    menuText: {
        fontSize: 16,
        marginLeft: 10,
    },
    separator: {
        height: 1,
        marginVertical: 10
    }
});