// src/navigation/AppNavigator.tsx

import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    type DrawerContentComponentProps
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useAppConfigStore } from '../store/useAppConfigStore';
import { useTargetChoirStore } from '../store/useTargetChoirStore';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { TabsNavigator } from './TabsNavigator';
import { PlatformNavigator } from './PlatformNavigator';

type RootStackParamList = {
    Login: undefined;
    ChangePassword: undefined;
    AuthenticatedApp: undefined;
};

type DrawerParamList = {
    Root: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

interface MenuItemProps {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly text: string;
    readonly color: string;
    readonly onPress: () => void;
}

const MenuItem = ({ icon, text, color, onPress }: MenuItemProps) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuText, { color }]}>{text}</Text>
    </TouchableOpacity>
);

const MenuInterno = ({ navigation }: DrawerContentComponentProps) => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const connectionMode = useAuthStore((state) => state.connectionMode);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const viewMode = useTargetChoirStore((state) => state.viewMode);
    const returnToPlatform = useTargetChoirStore((state) => state.returnToPlatform);
    const isPlatformTenantView = user?.role === 'SUPER_ADMIN' && viewMode === 'tenant';
    const rootLabel = isPlatformTenantView
        ? selectedChoir?.name ?? 'Coro'
        : user?.role === 'SUPER_ADMIN'
            ? 'Consola'
            : 'Inicio';
    const connected = useChatStore((state) => state.connected);
    const colors = useTheme().currentTheme;
    const online = connectionMode === 'online' && connected;

    return (
        <DrawerContentScrollView style={{ backgroundColor: colors.navColor }}>
            <View style={[styles.profileHeader, { borderBottomColor: colors.borderColor }]}>
                <View>
                    <Image
                        source={user?.cachedImageUrl || user?.imageUrl
                            ? { uri: user.cachedImageUrl ?? user.imageUrl }
                            : require('../../assets/icon.png')}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    />
                    <View style={[
                        styles.statusDot,
                        {
                            backgroundColor: online ? '#4CAF50' : '#BDBDBD',
                            borderColor: colors.backgroundColor
                        }
                    ]} />
                </View>
                <Text style={[styles.name, { color: colors.textColor }]}>{user?.name ?? 'Usuario'}</Text>
                <Text style={[styles.username, { color: colors.secondaryTextColor }]}>@{user?.username ?? ''}</Text>
                {connectionMode === 'offline' && (
                    <Text style={[styles.offlineLabel, { color: colors.secondaryTextColor }]}>Modo sin conexión</Text>
                )}
            </View>

            <View style={styles.menuContainer}>
                <MenuItem
                    icon="home-outline"
                    text={rootLabel}
                    color={colors.textColor}
                    onPress={() => navigation.navigate('Root')}
                />
                {isPlatformTenantView && (
                    <MenuItem
                        icon="grid-outline"
                        text="Volver a consola"
                        color={colors.primaryColor}
                        onPress={() => {
                            returnToPlatform();
                            navigation.navigate('Root');
                        }}
                    />
                )}
                <View style={[styles.separator, { backgroundColor: colors.borderColor }]} />
                <MenuItem
                    icon="log-out-outline"
                    text="Cerrar sesión"
                    color="#e74c3c"
                    onPress={() => logout().catch(() => undefined)}
                />
            </View>
        </DrawerContentScrollView>
    );
};

const HeaderWithLogo = ({ title, tintColor }: { readonly title: string; readonly tintColor?: string }) => {
    const appLogoUrl = useAppConfigStore((state) => state.appLogoUrl);

    return (
        <View style={styles.headerTitle}>
            <Image
                source={appLogoUrl ? { uri: appLogoUrl } : require('../../assets/icon.png')}
                style={styles.headerLogo}
                resizeMode="contain"
            />
            <Text style={[styles.headerText, { color: tintColor }]}>{title}</Text>
        </View>
    );
};


const AuthenticatedRoot = () => {
    const role = useAuthStore((state) => state.user?.role);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const viewMode = useTargetChoirStore((state) => state.viewMode);
    const shouldShowTenantApp = role === 'SUPER_ADMIN' &&
        viewMode === 'tenant' &&
        selectedChoir !== null;

    if (role === 'SUPER_ADMIN' && !shouldShowTenantApp) {
        return <PlatformNavigator />;
    }

    return <TabsNavigator />;
};

const AuthenticatedDrawer = () => {
    const width = useWindowDimensions().width;
    const colors = useTheme().currentTheme;
    const role = useAuthStore((state) => state.user?.role);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const viewMode = useTargetChoirStore((state) => state.viewMode);
    const rootTitle = role === 'SUPER_ADMIN'
        ? viewMode === 'tenant' && selectedChoir
            ? selectedChoir.name
            : 'Consola'
        : 'Inicio';

    return (
        <Drawer.Navigator
            screenOptions={{
                drawerType: width >= 768 ? 'permanent' : 'front',
                drawerStyle: { width: 250, backgroundColor: colors.navColor },
                headerTintColor: colors.primaryColor,
                headerStyle: { backgroundColor: colors.navColor },
                headerTitleStyle: { color: colors.textColor }
            }}
            drawerContent={(props) => <MenuInterno {...props} />}
        >
            <Drawer.Screen
                name="Root"
                component={AuthenticatedRoot}
                options={{
                    title: rootTitle,
                    headerTitle: (props) => <HeaderWithLogo title={rootTitle} tintColor={props.tintColor} />
                }}
            />
        </Drawer.Navigator>
    );
};

export const AppNavigator = () => {
    const status = useAuthStore((state) => state.status);
    const requiresPasswordChange = useAuthStore((state) => state.requiresPasswordChange);

    if (status === 'checking') {
        return <LoadingScreen />;
    }

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {status !== 'authenticated' ? (
                <RootStack.Screen name="Login" component={LoginScreen} />
            ) : requiresPasswordChange ? (
                <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            ) : (
                <RootStack.Screen name="AuthenticatedApp" component={AuthenticatedDrawer} />
            )}
        </RootStack.Navigator>
    );
};

const styles = StyleSheet.create({
    profileHeader: { padding: 20, marginBottom: 10, borderBottomWidth: 1 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
    statusDot: { position: 'absolute', bottom: 0, left: 70, width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
    name: { fontSize: 18, fontWeight: '700', marginTop: 10 },
    username: { fontSize: 14 },
    offlineLabel: { fontSize: 12, marginTop: 8 },
    menuContainer: { marginHorizontal: 20 },
    menuButton: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    menuText: { fontSize: 16, marginLeft: 10 },
    separator: { height: 1, marginVertical: 10 },
    headerTitle: { flexDirection: 'row', alignItems: 'center' },
    headerLogo: { width: 30, height: 30, borderRadius: 8, marginRight: 10 },
    headerText: { fontSize: 18, fontWeight: '700' }
});
