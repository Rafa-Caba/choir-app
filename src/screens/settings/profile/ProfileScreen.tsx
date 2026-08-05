// src/screens/settings/profile/ProfileScreen.tsx

import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';
import type { Theme } from '../../../types/theme';

interface InfoItemProps {
    readonly label: string;
    readonly value: string | null | undefined;
    readonly colors: Theme;
}

const InfoItem = ({ label, value, colors }: InfoItemProps) => (
    <View style={styles.infoItem}>
        <Text style={[styles.label, { color: colors.secondaryTextColor }]}>{label}:</Text>
        <Text style={[styles.value, { color: colors.textColor }]}>{value || '-'}</Text>
    </View>
);

export const ProfileScreen = () => {
    const user = useAuthStore((state) => state.user);
    const colors = useTheme().currentTheme;
    const username = user?.name || 'Usuario';
    const instrument = user?.instrument || 'Voz';
    const photoUrl = user?.cachedImageUrl || user?.imageUrl || 'https://via.placeholder.com/150';

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}> 
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: photoUrl }}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    />
                </View>

                <InfoItem label="Nombre" value={username} colors={colors} />
                <InfoItem label="Usuario" value={user?.username} colors={colors} />
                <InfoItem label="Correo" value={user?.email} colors={colors} />
                <InfoItem label="Instrumento" value={instrument} colors={colors} />
                {user?.bio ? <InfoItem label="Biografía" value={user.bio} colors={colors} /> : null}
                <InfoItem label="Rol" value={user?.role} colors={colors} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20, marginTop: 30, marginBottom: 50 },
    avatarContainer: { alignItems: 'center', marginBottom: 40 },
    avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 3 },
    infoItem: { marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 5 },
    value: { fontSize: 20, fontWeight: 'bold' }
});
