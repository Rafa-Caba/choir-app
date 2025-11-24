import React, { useEffect } from 'react';
import { useWindowDimensions, View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons as Icon} from '@expo/vector-icons';

// Stores & Context
import { useAuthStore } from '../store/useAuthStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useTheme } from '../context/ThemeContext';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { CreateAnnouncementScreen } from '../screens/CreateAnnouncementScreen';
import { TabsNavigator } from './TabsNavigator';
import { updatePushToken } from '../services/auth';

const Drawer = createDrawerNavigator();

export const AppNavigator = () => {
    const { status, checkAuth } = useAuthStore();
    const { expoPushToken } = usePushNotifications();
    const { width } = useWindowDimensions();
    
    // Get Theme for the Navigator Options (Header/Drawer Container)
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

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
                    backgroundColor: colors.navBg
                },
                // Dynamic Header Styling
                headerTintColor: colors.primary, 
                headerStyle: {
                    backgroundColor: colors.navBg, // Or colors.navBg
                    elevation: 0,
                    shadowOpacity: 0
                },
                headerTitleStyle: {
                    color: colors.text
                }
            }}
            drawerContent={(props) => <MenuInterno {...props} />}
        >
            {status !== 'authenticated' ? (
                <>
                    <Drawer.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
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
    
    // 5. Get Theme for the internal content (Text, Icons)
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    return (
        <DrawerContentScrollView style={{ backgroundColor: colors.navBg }}>
            {/* Avatar Container */}
            <View style={styles.avatarContainer}>
                <Image 
                    source={{ uri: user?.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }}
                    style={[styles.avatar, { borderColor: colors.primary }]} // Dynamic Border
                />
                <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.name || 'Usuario'}
                </Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuContainer}>
                <MenuItem 
                    icon="home-outline" 
                    text="Home" 
                    color={colors.primary} // Pass dynamic color
                    textColor={colors.text}
                    onPress={() => navigation.navigate('Root', { 
                        screen: 'HomeTab',
                        params: { screen: 'HomeScreen' }
                    })} 
                />
                <MenuItem 
                    icon="person-outline" 
                    text="Perfil" 
                    color={colors.primary}
                    textColor={colors.text}
                    onPress={() => navigation.navigate('Root', { 
                        screen: 'SettingsTab',
                        params: { screen: 'PerfilScreen' }
                    })} 
                />

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                <MenuItem 
                    icon="log-out-outline" 
                    text="Cerrar Sesión" 
                    onPress={logout} 
                    color="#e74c3c" // Logout usually stays red
                    textColor="#e74c3c"
                />
            </View>
        </DrawerContentScrollView>
    );
};

// Helper Component updated to accept textColor
const MenuItem = ({ icon, text, onPress, color, textColor }: any) => (
    <TouchableOpacity style={styles.menuBtn} onPress={onPress}>
        <Icon name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color: textColor }]}>{text}</Text>
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
    },
    userName: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
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