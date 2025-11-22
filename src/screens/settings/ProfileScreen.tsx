import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { styles } from '../../theme/appTheme';


export const ProfileScreen = () => {
    const { user } = useAuthStore();

    // Use defaults if fields are missing
    const username = user?.name || 'Usuario';
    const instrument = user?.instrument || 'Voz';
    const photoURL = user?.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
    const userRole = user?.role;

    return (
        <ScrollView style={[styles.globalMargin, { paddingHorizontal: 20 }]}>
            <View style={{ marginBottom: 50, marginTop: 30 }}>
                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                    <Image 
                        source={{ uri: photoURL }} 
                        style={{ width: 150, height: 150, borderRadius: 75 }} 
                    />
                </View>

                <InfoItem label="Nombre" value={username} />
                <InfoItem label="Usuario" value={user?.username} />
                <InfoItem label="Correo" value={user?.email} />
                <InfoItem label="Instrumento" value={instrument} />
                {user?.bio && <InfoItem label="Biografía" value={user.bio} />}
                <InfoItem label="Rol de Usuario" value={userRole} />
            </View>
        </ScrollView>
    );
};

const InfoItem = ({ label, value }: any) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, color: '#666' }}>{label}:</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>{value || '-'}</Text>
    </View>
);