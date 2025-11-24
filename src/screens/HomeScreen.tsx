import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Stores
import { useAuthStore } from '../store/useAuthStore';
import { useAnnouncementStore } from '../store/useAnnouncementStore';

// Components
import { AnnouncementCard } from '../components/AnnouncementCard';

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    
    // Get the current theme colors
    const { currentTheme } = useTheme();
    
    const { user } = useAuthStore();
    const { announcements, fetchPublicAnnouncements, fetchAdminAnnouncements, loading } = useAnnouncementStore();

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    useEffect(() => {
        if (canEdit) {
            fetchAdminAnnouncements();
        } else {
            fetchPublicAnnouncements();
        }
    }, [canEdit]);

    const handleCardPress = (announcement: any) => {
        if (canEdit) {
            navigation.navigate('CreateAnnouncement', { announcement });
        } else {
            console.log('Viewing detail:', announcement.id);
        }
    };

    return (
        <View style={[
            styles.container, 
            { paddingTop: insets.top + 10, backgroundColor: currentTheme.colors.background }
        ]}>
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: currentTheme.colors.textSecondary }]}>
                        Hola,
                    </Text>
                    <Text style={[styles.name, { color: currentTheme.colors.text }]}>
                        {user?.name}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Image 
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                        style={[styles.avatar, { borderColor: currentTheme.colors.primary }]}
                    />
                </TouchableOpacity>
            </View>

            {/* Section Title & Action */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                    Avisos
                </Text>
                {canEdit && (
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: currentTheme.colors.button }]}
                        onPress={() => navigation.navigate('CreateAnnouncement')}
                    >
                        <Text style={[styles.addButtonText, { color: currentTheme.colors.buttonText }]}>
                            + Nuevo
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={announcements}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <AnnouncementCard 
                        announcement={item}
                        onPress={() => handleCardPress(item)}
                    />
                )}
                refreshing={loading}
                onRefresh={canEdit ? fetchAdminAnnouncements : fetchPublicAnnouncements}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
                        No hay avisos recientes.
                    </Text>
                }
            />
        </View>
    );
};

// Keep LAYOUT styles here. Remove COLORS from here.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        // color removed
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    addButton: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16
    }
});