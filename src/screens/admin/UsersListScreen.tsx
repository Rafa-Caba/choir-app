import React, { useCallback } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
    Alert, Platform, ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '../../types/auth';

export const UsersListScreen = () => {
    const navigation = useNavigation<any>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { users, fetchUsers, removeUserAction, loading, refreshing } = useAdminUsersStore();

    // Refresh list when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUsers(true);
        }, [])
    );

    const handleEdit = (user: User) => {
        navigation.navigate('ManageUserScreen', { user });
    };

    const handleDelete = (id: string, name: string) => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm(`¿Estás seguro de eliminar a ${name}?`);
            if (confirm) removeUserAction(id);
        } else {
            Alert.alert(
                "Eliminar Usuario",
                `¿Estás seguro de eliminar a ${name}?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => removeUserAction(id) }
                ]
            );
        }
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={[styles.card, { backgroundColor: colors.cardColor }]}>
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => handleEdit(item)}
            >
                <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.textColor }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.role, { color: colors.secondaryTextColor }]}>
                        {item.role} • {item.instrument || 'Sin instrumento'}
                    </Text>
                    {item.voice && (
                        <View style={styles.voiceTag}>
                            <Ionicons name="mic" size={10} color="white" />
                            <Text style={styles.voiceText}>Voz</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!loading || refreshing) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primaryColor} />
            </View>
        );
    };

    // Initial Load Spinner
    if (loading && users.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primaryColor} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Usuarios</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageUserScreen')}
                >
                    <Ionicons name="person-add" size={20} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}

                refreshing={refreshing}
                onRefresh={() => fetchUsers(true)}

                onEndReached={() => fetchUsers(false)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}

                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                        No hay usuarios registrados.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold' },
    addBtn: { padding: 12, borderRadius: 25, elevation: 3 },

    card: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 12,
        marginBottom: 10, elevation: 2, overflow: 'hidden'
    },
    cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#ccc' },
    name: { fontSize: 16, fontWeight: 'bold' },
    role: { fontSize: 12, marginTop: 2, textTransform: 'uppercase' },

    voiceTag: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        marginTop: 4, alignSelf: 'flex-start'
    },
    voiceText: { color: 'white', fontSize: 10, marginLeft: 2, fontWeight: 'bold' },

    actions: { flexDirection: 'row', paddingRight: 10 },
    actionBtn: { padding: 8 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});