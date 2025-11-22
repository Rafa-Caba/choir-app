import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';
import { styles as themeStyles } from '../../theme/appTheme';

export const UsersListScreen = () => {
    const navigation = useNavigation<any>();
    const { users, fetchUsers, removeUserAction, loading } = useAdminUsersStore();

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            "Eliminar Usuario",
            `¿Estás seguro de eliminar a ${name}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => removeUserAction(id) }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ManageUserScreen', { user: item })}
        >
            <Image 
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/50' }} 
                style={styles.avatar} 
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.role} • {item.instrument}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{padding: 10}}>
                <Ionicons name="trash-outline" size={22} color="#E91E63" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={themeStyles.title}>Usuarios</Text>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('ManageUserScreen')} // No param = Create
                >
                    <Ionicons name="person-add" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={fetchUsers}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    addBtn: { backgroundColor: '#8B4BFF', padding: 10, borderRadius: 25 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    role: { fontSize: 14, color: '#888' }
});