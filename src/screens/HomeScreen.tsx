import React, { useEffect } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
    Alert, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { useAnnouncementStore } from '../store/useAnnouncementStore';

import { AnnouncementCard } from '../components/AnnouncementCard';
import { Announcement } from '../types/announcement';
import { useChatStore } from '../store/useChatStore';

export const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { connected } = useChatStore();


    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { user } = useAuthStore();

    const {
        announcements,
        fetchPublicAnnouncements,
        fetchAdminAnnouncements,
        removeAnnouncement,
        loading
    } = useAnnouncementStore();

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    useEffect(() => {
        if (canEdit) {
            fetchAdminAnnouncements();
        } else {
            fetchPublicAnnouncements();
        }
    }, [canEdit]);

    const handleCardPress = (announcement: Announcement) => {
        if (canEdit) {
            navigation.navigate('CreateAnnouncement', { announcement });
        }
    };

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Delete this announcement?")) {
                removeAnnouncement(id);
            }
        } else {
            Alert.alert(
                "Delete Announcement",
                "Are you sure you want to delete this?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => removeAnnouncement(id)
                    }
                ]
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.secondaryTextColor }]}>
                        Hello,
                    </Text>
                    <Text style={[styles.name, { color: colors.textColor }]}>
                        {user?.name || 'Guest'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    {/* <Image
                        source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    /> */}
                    <View>
                        <Image
                            source={{ uri: user?.imageUrl || 'https://via.placeholder.com/100' }}
                            style={styles.avatar}
                        />
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: connected ? '#4CAF50' : '#BDBDBD', borderColor: colors.backgroundColor }
                        ]} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Section Title & Action */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                    Announcements
                </Text>
                {canEdit && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                        onPress={() => navigation.navigate('CreateAnnouncement')}
                    >
                        <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>
                            + New
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={announcements}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <AnnouncementCard
                        announcement={item}
                        onPress={() => handleCardPress(item)}
                        onDelete={canEdit ? () => handleDelete(item.id) : undefined}
                    />
                )}
                refreshing={loading}
                onRefresh={canEdit ? fetchAdminAnnouncements : fetchPublicAnnouncements}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                        No recent announcements.
                    </Text>
                }
            />
        </View>
    );
};

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
        marginTop: 5
    },
    statusDot: {
        position: 'absolute', bottom: 0, left: 52,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2
    },
    greeting: { fontSize: 16 },
    name: { fontSize: 22, fontWeight: 'bold' },
    avatar: { width: 75, height: 75, borderRadius: 50, borderWidth: 2 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold' },
    addButton: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
    addButtonText: { fontWeight: '600', fontSize: 14 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});