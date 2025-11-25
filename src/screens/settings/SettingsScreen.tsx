import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext'; // Import Theme

export const SettingsScreen = ({ navigation }: any) => {
    const { user, logout } = useAuthStore();
    const insets = useSafeAreaInsets();
    
    // Get Theme
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>

            {/* Profile Pic */}
            <View style={styles.profileSection}>
                 <TouchableOpacity onPress={() => navigation.navigate('PerfilScreen')}>
                    <Image 
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/150' }}
                        style={[styles.avatar, { borderColor: colors.primary }]}
                    />
                </TouchableOpacity>
            </View>

            {/* Options List */}
            <View style={styles.listContainer}>
                <SettingsItem 
                    icon="person-outline" 
                    text="Perfil" 
                    colors={colors}
                    onPress={() => navigation.navigate('PerfilScreen')} 
                />
                <SettingsItem 
                    icon="create-outline"
                    text="Editar Perfil" 
                    colors={colors}
                    onPress={() => navigation.navigate('EditarPerfilScreen')} 
                />
                <SettingsItem 
                    icon="color-palette-outline" 
                    text="Temas" 
                    colors={colors}
                    onPress={() => navigation.navigate('ThemeSelectionScreen')}
                />
                
                {user?.role === 'ADMIN' && (
                    <>
                        <SettingsItem 
                            icon="color-filter-outline" 
                            text="Editor de Temas (Admin)" 
                            colors={colors}
                            onPress={() => navigation.navigate('AdminThemeEditor')} 
                        />
                        <SettingsItem 
                            icon="people-outline" 
                            text="Administrar Usuarios" 
                            colors={colors}
                            onPress={() => navigation.navigate('UsersListScreen')} 
                        />

                        <SettingsItem 
                            icon="settings-outline" 
                            text="Ajustes de la App" 
                            colors={colors}
                            onPress={() => navigation.navigate('AdminSettingsScreen')} 
                        />
                    </>
                )}

                <SettingsItem 
                    icon="log-out-outline" 
                    text="Cerrar Sesión" 
                    colors={colors}
                    onPress={logout} 
                    isDestructive 
                />
                
                <Icon 
                    name="musical-notes" size={150} 
                    color={currentTheme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                    style={styles.bgIcon} 
                />
            </View>

            <View style={styles.footer}>
                <Text style={{ fontWeight: 'bold', textAlign: 'center', color: colors.text }}>Acerca de:</Text>
                <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Rafael Cabanillas - 2025</Text>
            </View>
        </View>
    );
};

const SettingsItem = ({ icon, text, onPress, colors, isDestructive }: any) => (
    <TouchableOpacity 
        style={styles.item}
        activeOpacity={0.6}
        onPress={onPress}
    >
        <Icon name={icon} size={28} color={isDestructive ? '#e74c3c' : colors.text} />
        <Text style={[
            styles.itemText, 
            { color: isDestructive ? '#e74c3c' : colors.text }
        ]}>
            {text}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    title: { fontSize: 28, marginBottom: 5, fontWeight: 'bold' },
    profileSection: { alignItems: 'center', marginVertical: 15 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2 },
    listContainer: { flex: 1, marginVertical: 10 },
    item: { borderRadius: 15, marginVertical: 8, flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
    itemText: { marginLeft: 15, fontSize: 18 },
    bgIcon: { alignSelf: 'center', marginTop: 40 },
    footer: { marginBottom: 20, alignSelf: 'center' }
});