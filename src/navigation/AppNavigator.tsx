import React, { useEffect } from 'react';
import { useWindowDimensions, View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons as Icon} from '@expo/vector-icons';

// Stores
import { useAuthStore } from '../store/useAuthStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
// import { RegistroScreen } from '../screens/RegistroScreen'; // Create placeholder if needed
import { LoadingScreen } from '../screens/LoadingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateAnnouncementScreen } from '../screens/CreateAnnouncementScreen';
import { TabsNavigator } from './TabsNavigator';
import { updatePushToken } from '../services/auth';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Drawer = createDrawerNavigator();

export const AppNavigator = () => {
    const { status, checkAuth } = useAuthStore();
    const { expoPushToken } = usePushNotifications();
    const { width } = useWindowDimensions();

    // Check token on app launch
    useEffect(() => {
        checkAuth();
    }, []);

    // Sync token when logged in
    useEffect(() => {
        if (status === 'authenticated' && expoPushToken) {
            console.log("Sending token to backend...");
            updatePushToken(expoPushToken);
        }
    }, [status, expoPushToken]);

    if (status === 'checking') return <LoadingScreen />;

    return (
        <Drawer.Navigator 
            screenOptions={{ 
                headerShown: true, // Show header for hamburger menu
                drawerType: width >= 768 ? 'permanent' : 'front',
                drawerStyle: { width: 250 },
                headerTintColor: '#8B4BFF'
            }}
            drawerContent={(props) => <MenuInterno {...props} />}
        >
            {status !== 'authenticated' ? (
                <>
                    <Drawer.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
                    {/* <Drawer.Screen name="RegistroScreen" component={RegistroScreen} options={{ headerShown: false }} /> */}
                </>
            ) : (
                <>
                    <Drawer.Screen name="Root" component={TabsNavigator} options={{ title: 'Inicio' }} />
                </>
            )}
        </Drawer.Navigator>
    );
};

// --- Custom Drawer Content ---

const MenuInterno = ({ navigation }: DrawerContentComponentProps) => {
    const { user, logout } = useAuthStore();

    return (
        <DrawerContentScrollView>
            {/* Avatar Container */}
            <View style={styles.avatarContainer}>
                <Image 
                    source={{ uri: user?.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuContainer}>
                <MenuItem 
                    icon="home-outline" 
                    text="Home" 
                    // FIX: Navigate to Root -> HomeTab
                    onPress={() => navigation.navigate('Root', { 
                        screen: 'HomeTab',
                        params: { screen: 'HomeScreen' }
                    })} 
                />
                <MenuItem 
                    icon="person-outline" 
                    text="Perfil" 
                    // FIX: Navigate to Root -> SettingsTab -> PerfilScreen
                    onPress={() => navigation.navigate('Root', { 
                        screen: 'SettingsTab',
                        params: { screen: 'PerfilScreen' }
                    })} 
                />

                <View style={styles.separator} />

                <MenuItem 
                    icon="log-out-outline" 
                    text="Cerrar Sesión" 
                    onPress={logout} 
                    color="#e74c3c"
                />
            </View>
        </DrawerContentScrollView>
    );
};

const MenuItem = ({ icon, text, onPress, color = '#5856D6' }: any) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress}>
        <Icon name={icon} size={22} color={color} />
        <Text style={{...styles.menuText, color}}>{text}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    avatarContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#8B4BFF'
    },
    userName: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
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
        backgroundColor: '#ccc',
        marginVertical: 10
    }
});