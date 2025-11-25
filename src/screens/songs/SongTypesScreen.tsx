import React, { useEffect, useState } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, 
    TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSongsStore } from '../../store/useSongsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export const SongTypesScreen = () => {
    const navigation = useNavigation<any>();
    const { songTypes, fetchData, loading, addType, editType, removeType } = useSongsStore();
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState<any | null>(null);
    const [typeName, setTypeName] = useState('');
    const [typeOrder, setTypeOrder] = useState('');

    useEffect(() => { fetchData(); }, []);

    const openModal = (type?: any) => {
        if (type) {
            setEditingType(type);
            setTypeName(type.name);
            setTypeOrder(type.order.toString());
        } else {
            setEditingType(null);
            setTypeName('');
            setTypeOrder('');
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!typeName) return;
        const order = parseInt(typeOrder) || 99;
        
        if (editingType) {
            await editType(editingType.id, typeName, order);
        } else {
            await addType(typeName, order);
        }
        setModalVisible(false);
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            "Eliminar Categoría",
            `¿Seguro que quieres borrar "${item.name}"? Esto podría afectar a los cantos asociados.`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => removeType(item.id) }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Tipos de Cantos</Text>
            
            {isAdmin && (
                <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: colors.button }]}
                    onPress={() => openModal()}
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonText }]}>+ Agregar Tipo</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={songTypes}
                keyExtractor={(item) => item.id.toString()}
                refreshing={loading}
                onRefresh={fetchData}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity 
                            style={{ flex: 1 }}
                            onPress={() => navigation.navigate('SongsListScreen', { typeId: item.id, typeName: item.name })}
                        >
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                        </TouchableOpacity>
                        
                        {isAdmin && (
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => openModal(item)} style={{ marginRight: 15 }}>
                                    <Ionicons name="pencil" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)}>
                                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            />

            {/* Manage Type Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingType ? 'Editar Tipo' : 'Nuevo Tipo'}
                        </Text>
                        
                        <Text style={{color: colors.textSecondary}}>Nombre:</Text>
                        <TextInput 
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
                            value={typeName} onChangeText={setTypeName} 
                        />

                        <Text style={{color: colors.textSecondary}}>Orden:</Text>
                        <TextInput 
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
                            value={typeOrder} onChangeText={setTypeOrder} keyboardType="numeric" 
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={{color: colors.textSecondary}}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.button }]}>
                                <Text style={{color: colors.buttonText}}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 28, marginBottom: 15, fontWeight: 'bold', textAlign: 'center' },
    addButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: { 
        padding: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
    },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    actions: { flexDirection: 'row' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 15, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15, marginTop: 5 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    cancelBtn: { padding: 10, marginRight: 10 },
    saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }
});