// src/screens/songs/SongTypesScreen.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    InputAccessoryView,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { SongsStackParamList } from '../../navigation/SongsNavigator';
import {
    useCreateSongTypeMutation,
    useDeleteSongTypeMutation,
    useSongTypesQuery,
    useUpdateSongTypeMutation
} from '../../hooks/query/useSongsData';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import type { SongType } from '../../types/song';

type SongTypesNavigation = NativeStackNavigationProp<SongsStackParamList, 'SongTypes'>;

const SONG_TYPE_ACCESSORY_ID = 'song-type-form-accessory';

const sortSongTypes = (left: SongType, right: SongType): number => {
    const orderDifference = left.order - right.order;

    if (orderDifference !== 0) {
        return orderDifference;
    }

    return left.name.localeCompare(right.name);
};

export const SongTypesScreen = () => {
    const navigation = useNavigation<SongTypesNavigation>();
    const nameInputRef = useRef<TextInput>(null);
    const orderInputRef = useRef<TextInput>(null);
    const songTypesQuery = useSongTypesQuery();
    const createTypeMutation = useCreateSongTypeMutation();
    const updateTypeMutation = useUpdateSongTypeMutation();
    const deleteTypeMutation = useDeleteSongTypeMutation();
    const songTypes = songTypesQuery.data ?? [];
    const loading = songTypesQuery.isLoading || songTypesQuery.isRefetching;
    const user = useAuthStore((state) => state.user);
    const colors = useTheme().currentTheme;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState<SongType | null>(null);
    const [typeName, setTypeName] = useState('');
    const [typeOrder, setTypeOrder] = useState('');
    const [isParent, setIsParent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const displayedTypes = useMemo(() => {
        return songTypes
            .filter((type) => currentParentId
                ? type.parentId === currentParentId
                : !type.parentId)
            .sort(sortSongTypes);
    }, [songTypes, currentParentId]);

    const parentName = currentParentId
        ? songTypes.find((type) => type.id === currentParentId)?.name ?? 'Categorías'
        : 'Categorías';

    const closeModal = (): void => {
        if (saving) {
            return;
        }

        Keyboard.dismiss();
        setModalVisible(false);
    };

    const openModal = (type?: SongType): void => {
        if (type) {
            setEditingType(type);
            setTypeName(type.name);
            setTypeOrder(String(type.order || 99));
            setIsParent(type.isParent);
        } else {
            setEditingType(null);
            setTypeName('');
            setTypeOrder('');
            setIsParent(false);
        }

        setModalVisible(true);
        setTimeout(() => nameInputRef.current?.focus(), 180);
    };

    const handleOrderChange = (value: string): void => {
        setTypeOrder(value.replace(/\D/gu, '').slice(0, 2));
    };

    const handleSave = async (): Promise<void> => {
        const normalizedName = typeName.trim();
        const parsedOrder = Number.parseInt(typeOrder, 10);

        if (!normalizedName) {
            Alert.alert('Error', 'El nombre es requerido.');
            return;
        }

        if (!Number.isInteger(parsedOrder) || parsedOrder < 1 || parsedOrder > 99) {
            Alert.alert('Error', 'El orden debe ser un número entre 1 y 99.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            if (editingType) {
                await updateTypeMutation.mutateAsync({
                    id: editingType.id,
                    name: normalizedName,
                    order: parsedOrder,
                    isParent
                });
            } else {
                await createTypeMutation.mutateAsync({
                    name: normalizedName,
                    order: parsedOrder,
                    parentId: currentParentId ?? undefined,
                    isParent: currentParentId ? false : isParent
                });
            }

            setModalVisible(false);
        } catch {
            Alert.alert('Error', 'No fue posible guardar la categoría. Intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item: SongType): void => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`¿Eliminar la categoría "${item.name}"?`);

            if (confirmed) {
                deleteTypeMutation.mutate(item.id);
            }

            return;
        }

        Alert.alert(
            'Eliminar categoría',
            `¿Deseas eliminar "${item.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        deleteTypeMutation.mutate(item.id);
                    }
                }
            ]
        );
    };

    const handleItemPress = (item: SongType): void => {
        if (item.isParent) {
            setCurrentParentId(item.id);
            return;
        }

        navigation.navigate('SongsListScreen', {
            typeId: item.id,
            typeName: item.name
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.headerRow}>
                {currentParentId && (
                    <TouchableOpacity
                        onPress={() => setCurrentParentId(null)}
                        style={styles.backButton}
                    >
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
                    activeOpacity={0.75}
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>
                        + {currentParentId ? 'Subcategoría' : 'Categoría'}
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={displayedTypes}
                keyExtractor={(item) => item.id}
                refreshing={loading}
                onRefresh={() => void songTypesQuery.refetch()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => handleItemPress(item)}
                        >
                            <View style={styles.cardTitleRow}>
                                {item.isParent && (
                                    <Ionicons
                                        name="folder-open"
                                        size={20}
                                        color={colors.primaryColor}
                                        style={styles.folderIcon}
                                    />
                                )}
                                <Text style={[styles.orderBadge, { color: colors.secondaryTextColor }]}>
                                    {item.order}
                                </Text>
                                <Text style={[styles.cardTitle, { color: colors.textColor }]}>{item.name}</Text>
                            </View>
                        </TouchableOpacity>

                        {isAdmin && (
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => openModal(item)} style={styles.editButton}>
                                    <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)}>
                                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={(
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                        No se encontraron categorías.
                    </Text>
                )}
            />

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                                {editingType ? 'Editar categoría' : 'Nueva categoría'}
                            </Text>

                            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Nombre</Text>
                            <TextInput
                                ref={nameInputRef}
                                style={[
                                    styles.input,
                                    {
                                        color: colors.textColor,
                                        borderColor: colors.borderColor,
                                        backgroundColor: colors.backgroundColor
                                    }
                                ]}
                                value={typeName}
                                onChangeText={setTypeName}
                                placeholder="Ej. Misa Ero Cras"
                                placeholderTextColor={colors.secondaryTextColor}
                                autoCorrect
                                spellCheck
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => orderInputRef.current?.focus()}
                                editable={!saving}
                                inputAccessoryViewID={Platform.OS === 'ios' ? SONG_TYPE_ACCESSORY_ID : undefined}
                            />

                            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Orden (1-99)</Text>
                            <TextInput
                                ref={orderInputRef}
                                style={[
                                    styles.input,
                                    {
                                        color: colors.textColor,
                                        borderColor: colors.borderColor,
                                        backgroundColor: colors.backgroundColor
                                    }
                                ]}
                                value={typeOrder}
                                onChangeText={handleOrderChange}
                                keyboardType="number-pad"
                                placeholder="99"
                                placeholderTextColor={colors.secondaryTextColor}
                                maxLength={2}
                                editable={!saving}
                                inputAccessoryViewID={Platform.OS === 'ios' ? SONG_TYPE_ACCESSORY_ID : undefined}
                            />

                            {keyboardVisible && (
                                <TouchableOpacity
                                    style={styles.dismissKeyboardButton}
                                    onPress={Keyboard.dismiss}
                                >
                                    <Ionicons name="chevron-down" size={18} color={colors.primaryColor} />
                                    <Text style={[styles.dismissKeyboardText, { color: colors.primaryColor }]}>
                                        Ocultar teclado
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {!currentParentId && !editingType && (
                                <View style={styles.switchRow}>
                                    <Text style={[styles.switchLabel, { color: colors.textColor }]}>
                                        ¿Es una carpeta principal, como una misa?
                                    </Text>
                                    <Switch
                                        value={isParent}
                                        onValueChange={setIsParent}
                                        trackColor={{ false: '#767577', true: colors.primaryColor }}
                                        thumbColor={isParent ? colors.buttonTextColor : '#f4f3f4'}
                                        disabled={saving}
                                    />
                                </View>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    onPress={closeModal}
                                    style={styles.cancelBtn}
                                    disabled={saving}
                                >
                                    <Text style={{ color: colors.secondaryTextColor }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => void handleSave()}
                                    style={[
                                        styles.saveBtn,
                                        { backgroundColor: colors.buttonColor },
                                        saving && styles.disabledButton
                                    ]}
                                    disabled={saving}
                                    activeOpacity={0.75}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.buttonTextColor} />
                                    ) : (
                                        <Text style={{ color: colors.buttonTextColor, fontWeight: 'bold' }}>
                                            Guardar
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                    {Platform.OS === 'ios' && (
                        <InputAccessoryView nativeID={SONG_TYPE_ACCESSORY_ID}>
                            <View style={[styles.accessoryBar, { backgroundColor: colors.cardColor, borderTopColor: colors.borderColor }]}>
                                <TouchableOpacity onPress={Keyboard.dismiss} style={styles.accessoryAction}>
                                    <Ionicons name="chevron-down" size={20} color={colors.primaryColor} />
                                    <Text style={[styles.accessoryText, { color: colors.primaryColor }]}>Ocultar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => void handleSave()}
                                    style={[styles.accessorySave, { backgroundColor: colors.buttonColor }]}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color={colors.buttonTextColor} />
                                    ) : (
                                        <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Guardar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </InputAccessoryView>
                    )}
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    backButton: { marginRight: 10 },
    addButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: {
        padding: 20,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardMain: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    orderBadge: { fontSize: 12, marginRight: 10, width: 25 },
    folderIcon: { marginRight: 10 },
    actions: { flexDirection: 'row' },
    editButton: { marginRight: 15 },
    emptyText: { textAlign: 'center', marginTop: 20 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center'
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        borderRadius: 15,
        padding: 20,
        elevation: 5,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center'
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { marginBottom: 5 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15 },
    dismissKeyboardButton: {
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -4,
        marginBottom: 14,
        paddingVertical: 6
    },
    dismissKeyboardText: { marginLeft: 5, fontWeight: '600' },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    switchLabel: { flex: 1, paddingRight: 12 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    cancelBtn: { padding: 10, marginRight: 10 },
    saveBtn: {
        minWidth: 100,
        minHeight: 44,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    disabledButton: { opacity: 0.65 },
    accessoryBar: {
        minHeight: 48,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    accessoryAction: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
    accessoryText: { fontWeight: '600' },
    accessorySave: { minWidth: 96, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
