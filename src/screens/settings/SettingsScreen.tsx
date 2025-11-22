import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { styles } from '../../theme/appTheme';
import { GalleryPhoto } from '../../components/GalleryPhoto';

export const SettingsScreen = ({ navigation }: any) => {
    const { user, logout } = useAuthStore();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.globalMargin, { flex: 1, marginTop: insets.top + 10 }]}>
            <Text style={styles.title}>Ajustes</Text>

            {/* Profile Pic */}
            <View style={{ display: 'flex', alignItems: 'center', marginVertical: 15 }}>
                <GalleryPhoto 
                    uri={user?.imageUrl || ''} 
                    // 3. PASS THE WHOLE ITEM OR ID, NOT JUST URL
                    onPress={() => navigation.navigate('ImageDetail', { image: user })} 
                    style={{
                        width: 200,
                        height: 200,
                        borderRadius: 100,
                        borderWidth: 2,
                        borderColor: '#8B4BFF',
                    }}
                />
                {/* <Image 
                    source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                    style={styles.avatar}
                /> */}
            </View>

            {/* Ooptios in Settings */}
            <View style={{ flex: 1, marginVertical: 30 }}>
                <SettingsItem 
                    icon="person-outline" 
                    text="Perfil" 
                    onPress={() => navigation.navigate('PerfilScreen')} 
                />
                <SettingsItem 
                    icon="create-outline" // Changed icon for clarity
                    text="Editar Perfil" 
                    onPress={() => navigation.navigate('EditarPerfilScreen')} 
                />
                <SettingsItem 
                    icon="color-palette-outline" 
                    text="Temas" 
                    onPress={() => navigation.navigate('ThemeSelectionScreen')}
                />
                {user?.role === 'ADMIN' && (
                    <SettingsItem 
                        icon="color-palette-outline" 
                        text="Editar Colores (Temas)" 
                        onPress={() => navigation.navigate('AdminThemeEditor')} 
                    />
                )}
                {user?.role === 'ADMIN' && (
                    <SettingsItem 
                        icon="people-outline" 
                        text="Administrar Usuarios" 
                        onPress={() => navigation.navigate('UsersListScreen')} 
                    />
                )}

                {/* Log out Option */}
                <SettingsItem 
                    icon="exit-outline" 
                    text="Cerrar Sesión" 
                    onPress={logout} 
                />
                
                <Icon 
                    name="musical-notes" size={150} 
                    color="rgba(0,0,0,.1)" 
                    style={{ 
                        alignSelf: 'center', 
                        bottom: innerWidth > 400 ? 150 : 220 }} 
                    />
            </View>

            <View style={{ marginBottom: 20, alignSelf: 'center' }}>
                <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>Acerca de:</Text>
                <Text style={{ textAlign: 'center' }}>Rafael Cabanillas - 2025</Text>
            </View>
        </View>
    );
};

const SettingsItem = ({ icon, text, onPress }: any) => (
    <TouchableOpacity 
        style={{ borderRadius: 15, marginVertical: innerWidth > 400 ? 9 : 6, flexDirection: 'row', alignItems: 'center' }}
        activeOpacity={0.6}
        onPress={onPress}
    >
        <Icon name={icon} size={30} color="black" />
        <Text style={{ marginLeft: 15, fontSize: innerWidth > 400 ? 20 : 17, color: '#000' }}>{text}</Text>
    </TouchableOpacity>
);