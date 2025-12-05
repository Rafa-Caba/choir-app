import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export const SettingsScreen = ({ navigation }: any) => {
    const { user, logout } = useAuthStore();
    const insets = useSafeAreaInsets();
    const { currentTheme } = useTheme();
    const { width } = useWindowDimensions();
    const middleScreens = width > 400;
    const colors = currentTheme;

    const Item = ({ icon, text, target, action, destructive }: any) => (
        <TouchableOpacity
            style={[styles.item, { marginTop: destructive ? 15 : 8 }]}
            activeOpacity={0.6}
            onPress={() => {
                if (action) action();
                else if (target) navigation.navigate(target);
            }}
        >
            <Ionicons name={icon} size={28} color={destructive ? '#e74c3c' : colors.textColor} />
            <Text style={[styles.itemText, { color: destructive ? '#e74c3c' : colors.textColor }]}>
                {text}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10, backgroundColor: colors.backgroundColor }]}>
            <Text style={[styles.title, { color: colors.textColor }]}>Ajustes</Text>

            <View style={styles.profileSection}>
                <TouchableOpacity onPress={() => navigation.navigate('PerfilScreen')}>
                    <Image
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/150' }}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                <Item icon="person-outline" text="Perfil" target="PerfilScreen" />
                <Item icon="create-outline" text="Editar Perfil" target="EditarPerfilScreen" />
                <Item icon="color-palette-outline" text="Apariencia / Temas" target="ThemeSelectionScreen" />

                {user?.role === 'ADMIN' && (
                    <View>
                        <View style={[styles.divider, { backgroundColor: colors.borderColor || '#ccc' }]} />
                        <Text style={[styles.sectionHeader, { color: colors.secondaryTextColor }]}>Administración</Text>

                        <Item icon="people-outline" text="Gestionar Usuarios" target="UsersListScreen" />
                        <Item icon="color-filter-outline" text="Gestionar Temas" target="ThemesListScreen" />
                        <Item icon="settings-outline" text="Ajustes de la App" target="AdminSettingsScreen" />
                    </View>
                )}

                <Item icon="log-out-outline" text="Cerrar Sesión" action={logout} destructive />

                {/* 🛠️ FIX: pointerEvents="none" allows clicks to pass through to buttons underneath */}
                <View style={[styles.bgIconContainer, { marginTop: middleScreens ? 30 : -230 }]} pointerEvents="none">
                    <Ionicons
                        name="musical-notes" size={150}
                        color={currentTheme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    />
                </View>

                <View style={[styles.footer, { marginTop: middleScreens ? 70 : 30 }]}>
                    <Text style={{ fontWeight: 'bold', textAlign: 'center', color: colors.textColor }}>Acerca de:</Text>
                    <Text style={{ textAlign: 'center', color: colors.secondaryTextColor }}>Rafael Cabanillas - 2025</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    title: { fontSize: 28, marginBottom: 5, fontWeight: 'bold' },
    profileSection: { alignItems: 'center', marginVertical: 15 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2 },
    listContainer: { flex: 1, marginVertical: 10 },
    item: { borderRadius: 15, marginTop: 8, marginBottom: 3, flexDirection: 'row', alignItems: 'center', paddingBottom: 5 },
    itemText: { marginLeft: 15, fontSize: 18 },
    bgIconContainer: { alignItems: 'center', marginTop: -230, marginBottom: 80 },
    footer: { marginTop: 30, marginBottom: 10, alignSelf: 'center' },
    divider: { height: 1, marginVertical: 20, width: '100%' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 }
});