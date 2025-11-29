import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Modal,
    TextInput, Alert, Switch, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSongsStore } from '../../store/useSongsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import type { SongType } from '../../types/song';

export const SongTypesScreen = () => {
    const navigation = useNavigation<any>();

    // Store now includes the hierarchy methods we added
    const { songTypes, fetchData, loading, addType, editType, removeType } = useSongsStore();
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // --- Hierarchy State ---
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);

    // --- Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState<SongType | null>(null);
    const [typeName, setTypeName] = useState('');
    const [typeOrder, setTypeOrder] = useState('');
    const [isParent, setIsParent] = useState(false); // Toggle for "Folder" type

    useEffect(() => {
        fetchData();
    }, []);

    // Filter list based on current level (Root vs Child)
    const displayedTypes = useMemo(() => {
        return songTypes
            .filter(t => {
                if (currentParentId) return t.parentId === currentParentId;
                // If at root, show items with NO parentId
                return !t.parentId;
            })
            .sort((a, b) => (a.order || 99) - (b.order || 99));
    }, [songTypes, currentParentId]);

    // Get current parent name for header display
    const parentName = currentParentId
        ? songTypes.find(t => t.id === currentParentId)?.name
        : 'Categories';

    const openModal = (type?: SongType) => {
        if (type) {
            setEditingType(type);
            setTypeName(type.name);
            setTypeOrder(type.order ? type.order.toString() : '99');
            setIsParent(type.isParent || false);
        } else {
            setEditingType(null);
            setTypeName('');
            setTypeOrder('');
            // If inside a folder, you can't create another folder (limit nesting to 1 level for simplicity)
            setIsParent(false);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!typeName.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }
        const order = parseInt(typeOrder) || 99;

        let success;
        if (editingType) {
            success = await editType(editingType.id, typeName, order, isParent);
        } else {
            // If we are inside a folder, the new item gets that parentId
            const newParentId = currentParentId;
            // If we are inside a folder, the new item cannot be a parent itself
            const newIsParent = currentParentId ? false : isParent;

            success = await addType(typeName, order, newParentId, newIsParent);
        }

        if (success) setModalVisible(false);
    };

    const handleDelete = (item: SongType) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`Delete category "${item.name}"?`)) removeType(item.id);
        } else {
            Alert.alert(
                "Delete Category",
                `Are you sure you want to delete "${item.name}"?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => removeType(item.id) }
                ]
            );
        }
    };

    const handleItemPress = (item: SongType) => {
        if (item.isParent) {
            // Drill down into folder (e.g. "Misa")
            setCurrentParentId(item.id);
        } else {
            // Go to songs list (e.g. "Entrada")
            navigation.navigate('SongsListScreen', { typeId: item.id, typeName: item.name });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>

            {/* Header / Breadcrumb */}
            <View style={styles.headerRow}>
                {currentParentId && (
                    <TouchableOpacity onPress={() => setCurrentParentId(null)} style={{ marginRight: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: colors.textColor }]}>
                    {parentName}
                </Text>
            </View>

            {isAdmin && (
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => openModal()}
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>
                        + {currentParentId ? 'Add Sub-Category' : 'Add Category'}
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={displayedTypes}
                keyExtractor={(item) => item.id}
                refreshing={loading}
                onRefresh={fetchData}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => handleItemPress(item)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Show Folder Icon if it's a parent container */}
                                {item.isParent && (
                                    <Ionicons name="folder-open" size={20} color={colors.primaryColor} style={{ marginRight: 10 }} />
                                )}
                                <Text style={[styles.orderBadge, { color: colors.secondaryTextColor }]}>{item.order}</Text>
                                <Text style={[styles.cardTitle, { color: colors.textColor }]}>{item.name}</Text>
                            </View>
                        </TouchableOpacity>

                        {isAdmin && (
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => openModal(item)} style={{ marginRight: 15 }}>
                                    <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)}>
                                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', marginTop: 20, color: colors.secondaryTextColor }}>
                        No categories found.
                    </Text>
                }
            />

            {/* Manage Type Modal */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                            {editingType ? 'Edit Category' : 'New Category'}
                        </Text>

                        <Text style={{ color: colors.secondaryTextColor, marginBottom: 5 }}>Name:</Text>
                        <TextInput
                            style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}
                            value={typeName} onChangeText={setTypeName}
                            placeholder="e.g. Mass" placeholderTextColor={colors.secondaryTextColor}
                        />

                        <Text style={{ color: colors.secondaryTextColor, marginBottom: 5 }}>Order (1-99):</Text>
                        <TextInput
                            style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}
                            value={typeOrder} onChangeText={setTypeOrder} keyboardType="numeric"
                            placeholder="99" placeholderTextColor={colors.secondaryTextColor}
                        />

                        {/* Only show "Is Parent" toggle if we are at root level and creating new */}
                        {!currentParentId && !editingType && (
                            <View style={styles.switchRow}>
                                <Text style={{ color: colors.textColor, flex: 1 }}>Is this a Folder (e.g. Mass)?</Text>
                                <Switch
                                    value={isParent}
                                    onValueChange={setIsParent}
                                    trackColor={{ false: "#767577", true: colors.primaryColor }}
                                    thumbColor={isParent ? colors.buttonTextColor : "#f4f3f4"}
                                />
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={{ color: colors.secondaryTextColor }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}>
                                <Text style={{ color: colors.buttonTextColor, fontWeight: 'bold' }}>Save</Text>
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
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    addButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: {
        padding: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    orderBadge: { fontSize: 12, marginRight: 10, width: 25 },
    actions: { flexDirection: 'row' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 15, padding: 20, elevation: 5, width: '100%', maxWidth: 400, alignSelf: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15 },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    cancelBtn: { padding: 10, marginRight: 10 },
    saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }
});