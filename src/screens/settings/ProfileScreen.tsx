import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export const ProfileScreen = () => {
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    // Use defaults if fields are missing
    const username = user?.name || 'Usuario';
    const instrument = user?.instrument || 'Voz';
    const photoURL = user?.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
    const userRole = user?.role;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ marginBottom: 50, marginTop: 30 }}>
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Image 
                        source={{ uri: photoURL }} 
                        style={{ width: 150, height: 150, borderRadius: 75 }} 
                    />
                </View>

                <InfoItem label="Nombre" value={username} colors={colors} />
                <InfoItem label="Usuario" value={user?.username} colors={colors} />
                <InfoItem label="Correo" value={user?.email} colors={colors} />
                <InfoItem label="Instrumento" value={instrument} colors={colors} />
                {user?.bio && <InfoItem label="Biografía" value={user.bio} colors={colors} />}
                <InfoItem label="Rol de Usuario" value={userRole} colors={colors} />
            </View>
        </ScrollView>
    );
};

const InfoItem = ({ label, value, colors }: any) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}:</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, paddingLeft: 15 },
    content: { paddingHorizontal: 20, marginTop: 30, marginBottom: 50 },
    avatarContainer: { alignItems: 'center', marginBottom: 40 },
    avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 3 },
    infoItem: { marginBottom: 20 },
    label: { fontSize: 16 },
    value: { fontSize: 20, fontWeight: 'bold' }
});