import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Stores
import { useAuthStore } from '../store/useAuthStore';
import { useAnnouncementStore } from '../store/useAnnouncementStore';

// Components
import { AnnouncementCard } from '../components/AnnouncementCard';

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    
    const { user } = useAuthStore();
    const { announcements, fetchPublicAnnouncements, loading } = useAnnouncementStore();

    // Fetch on mount
    useEffect(() => {
        fetchPublicAnnouncements();
    }, []);

    // Only Admins/Editors can see the "Add" button
    const canCreate = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.name}>{user?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Image 
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>
            </View>

            {/* Section Title & Action */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Avisos</Text>
                {canCreate && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('CreateAnnouncement')}
                    >
                        <Text style={styles.addButtonText}>+ Nuevo</Text>
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
                        onPress={() => console.log('Open details', item.id)} 
                    />
                )}
                refreshing={loading}
                onRefresh={fetchPublicAnnouncements}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay avisos recientes.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        color: '#666',
    },
    name: {
        fontSize: innerWidth > 400 ? 22 : 20,
        fontWeight: 'bold',
        color: '#333',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#8B4BFF',
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
        color: '#333',
    },
    addButton: {
        backgroundColor: '#8B4BFF',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 50,
        fontSize: 16
    }
});