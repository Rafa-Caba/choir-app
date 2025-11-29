import React, { useState, useMemo } from 'react';
import {
    Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { SongType } from '../../types/song';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (typeId: string, typeName: string) => void;
    allTypes: SongType[];
    selectedTypeId?: string | null;
}

export const TypeSelectorModal = ({ visible, onClose, onSelect, allTypes, selectedTypeId }: Props) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    // Navigation State inside the modal
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);

    // Filter displayed types based on current level
    const displayedTypes = useMemo(() => {
        return allTypes
            .filter(t => {
                if (currentParentId) return t.parentId === currentParentId;
                return !t.parentId; // Root items
            })
            .sort((a, b) => (a.order || 99) - (b.order || 99));
    }, [allTypes, currentParentId]);

    const getParentName = () => {
        if (!currentParentId) return 'Select Category';
        return allTypes.find(t => t.id === currentParentId)?.name || 'Back';
    };

    const handlePress = (item: SongType) => {
        if (item.isParent) {
            // It's a folder (e.g. "Misa"), drill down
            setCurrentParentId(item.id);
        } else {
            // It's a selectable type (e.g. "Alabanza" or "Entrada")
            onSelect(item.id, item.name);
            onClose();
            // Reset hierarchy for next time
            setTimeout(() => setCurrentParentId(null), 300);
        }
    };

    const handleBack = () => {
        setCurrentParentId(null);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.cardColor }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                        {currentParentId ? (
                            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={24} color={colors.primaryColor} />
                                <Text style={[styles.headerTitle, { color: colors.textColor }]}>
                                    {getParentName()}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={[styles.headerTitle, { color: colors.textColor }]}>Select Category</Text>
                        )}
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.secondaryTextColor} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={displayedTypes}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const isSelected = item.id === selectedTypeId;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        { borderBottomColor: colors.borderColor },
                                        isSelected && { backgroundColor: colors.backgroundColor }
                                    ]}
                                    onPress={() => handlePress(item)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {item.isParent && (
                                            <Ionicons name="folder-open-outline" size={20} color={colors.primaryColor} style={{ marginRight: 10 }} />
                                        )}
                                        <Text style={[
                                            styles.itemText,
                                            { color: isSelected ? colors.primaryColor : colors.textColor, fontWeight: isSelected ? 'bold' : 'normal' }
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </View>

                                    {/* Chevron indicating more options inside */}
                                    {item.isParent ? (
                                        <Ionicons name="chevron-forward" size={20} color={colors.secondaryTextColor} />
                                    ) : (
                                        isSelected && <Ionicons name="checkmark" size={20} color={colors.primaryColor} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={{ padding: 20, textAlign: 'center', color: colors.secondaryTextColor }}>
                                No sub-categories found.
                            </Text>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    content: { borderRadius: 12, maxHeight: '80%', width: '100%', maxWidth: 400, alignSelf: 'center', padding: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, marginBottom: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    backBtn: { flexDirection: 'row', alignItems: 'center' },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
    itemText: { fontSize: 16 }
});