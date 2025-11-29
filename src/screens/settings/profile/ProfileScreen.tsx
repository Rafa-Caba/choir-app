import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';

export const ProfileScreen = () => {
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const username = user?.name || 'User';
    const instrument = user?.instrument || 'Voice';
    const photoURL = user?.imageUrl || 'https://via.placeholder.com/150';
    const userRole = user?.role;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: photoURL }}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    />
                </View>

                <InfoItem label="Name" value={username} colors={colors} />
                <InfoItem label="Username" value={user?.username} colors={colors} />
                <InfoItem label="Email" value={user?.email} colors={colors} />
                <InfoItem label="Instrument" value={instrument} colors={colors} />
                {user?.bio && <InfoItem label="Bio" value={user.bio} colors={colors} />}
                <InfoItem label="Role" value={userRole} colors={colors} />
            </View>
        </ScrollView>
    );
};

const InfoItem = ({ label, value, colors }: any) => (
    <View style={styles.infoItem}>
        <Text style={[styles.label, { color: colors.secondaryTextColor }]}>{label}:</Text>
        <Text style={[styles.value, { color: colors.textColor }]}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20, marginTop: 30, marginBottom: 50 },
    avatarContainer: { alignItems: 'center', marginBottom: 40 },
    avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 3 },
    infoItem: { marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 5 },
    value: { fontSize: 20, fontWeight: 'bold' }
});