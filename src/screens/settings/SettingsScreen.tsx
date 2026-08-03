// src/screens/settings/SettingsScreen.tsx

import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    canManageSettings,
    canManageUsers,
    canViewAuditLogs
} from '../../auth/permissions';
import { useTheme } from '../../context/ThemeContext';
import type { SettingsStackParamList } from '../../navigation/SettingsNavigator';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsScreen'>;
interface SettingsItemProps {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly text: string;
    readonly onPress: () => void;
    readonly destructive?: boolean;
}

export const SettingsScreen = ({ navigation }: Props) => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const colors = useTheme().currentTheme;

    const Item = ({ icon, text, onPress, destructive = false }: SettingsItemProps) => (
        <TouchableOpacity style={styles.item} activeOpacity={0.65} onPress={onPress}>
            <Ionicons name={icon} size={25} color={destructive ? '#C62828' : colors.textColor} />
            <Text style={[styles.itemText, { color: destructive ? '#C62828' : colors.textColor }]}>{text}</Text>
            {!destructive && <Ionicons name="chevron-forward" size={19} color={colors.secondaryTextColor} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <Text style={[styles.title, { color: colors.textColor }]}>Ajustes</Text>

            <TouchableOpacity style={styles.profile} onPress={() => navigation.navigate('PerfilScreen')}>
                <Image
                    source={{ uri: user?.cachedImageUrl ?? user?.imageUrl ?? 'https://via.placeholder.com/120' }}
                    style={[styles.avatar, { borderColor: colors.primaryColor }]}
                />
                <View style={styles.profileText}>
                    <Text style={[styles.name, { color: colors.textColor }]}>{user?.name ?? 'Usuario'}</Text>
                    <Text style={[styles.username, { color: colors.secondaryTextColor }]}>@{user?.username ?? ''} · {user?.role ?? ''}</Text>
                </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <Item icon="person-outline" text="Mi perfil" onPress={() => navigation.navigate('PerfilScreen')} />
                <Item icon="create-outline" text="Editar perfil" onPress={() => navigation.navigate('EditarPerfilScreen')} />
                <Item icon="color-palette-outline" text="Apariencia y temas" onPress={() => navigation.navigate('ThemeSelectionScreen')} />

                {(canManageUsers(user?.role) || canManageSettings(user?.role) || canViewAuditLogs(user?.role)) && (
                    <Text style={[styles.sectionTitle, { color: colors.secondaryTextColor }]}>Administración</Text>
                )}

                {canManageUsers(user?.role) && (
                    <Item icon="people-outline" text="Gestionar usuarios" onPress={() => navigation.navigate('UsersListScreen')} />
                )}
                {canManageSettings(user?.role) && (
                    <>
                        <Item icon="color-filter-outline" text="Gestionar temas" onPress={() => navigation.navigate('ThemesListScreen')} />
                        <Item icon="settings-outline" text="Configuración del coro" onPress={() => navigation.navigate('AdminSettingsScreen')} />
                    </>
                )}
                {canViewAuditLogs(user?.role) && (
                    <Item icon="shield-checkmark-outline" text="Auditoría del coro" onPress={() => navigation.navigate('AuditLogsScreen', { scope: 'tenant' })} />
                )}

                <View style={[styles.separator, { backgroundColor: colors.borderColor }]} />
                <Item icon="log-out-outline" text="Cerrar sesión" destructive onPress={() => logout().catch(() => undefined)} />

                <View style={styles.footer}>
                    <Text style={[styles.footerTitle, { color: colors.textColor }]}>Choir App</Text>
                    <Text style={[styles.footerText, { color: colors.secondaryTextColor }]}>Rafael Cabanillas · 2026</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
    title: { fontSize: 29, fontWeight: '900' },
    profile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
    avatar: { width: 78, height: 78, borderRadius: 39, borderWidth: 2, backgroundColor: '#D1D5DB' },
    profileText: { flex: 1, marginLeft: 14 },
    name: { fontSize: 20, fontWeight: '900' },
    username: { marginTop: 3, fontSize: 13 },
    list: { paddingBottom: 34 },
    item: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 12, paddingHorizontal: 4 },
    itemText: { flex: 1, marginLeft: 14, fontSize: 17, fontWeight: '600' },
    sectionTitle: { marginTop: 20, marginBottom: 6, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
    separator: { height: 1, marginVertical: 18 },
    footer: { alignItems: 'center', marginTop: 30 },
    footerTitle: { fontWeight: '900' },
    footerText: { marginTop: 3, fontSize: 12 }
});
