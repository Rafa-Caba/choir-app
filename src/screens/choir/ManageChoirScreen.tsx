// src/screens/choir/ManageChoirScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { canManageChoirs } from '../../auth/permissions';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import type { PlatformStackParamList } from '../../navigation/PlatformNavigator';
import { getApiErrorMessage } from '../../services/auth';
import { useAdminChoirsStore } from '../../store/useAdminChoirsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { CreateChoirPayload } from '../../types/choir';

type Props = NativeStackScreenProps<PlatformStackParamList, 'ManageChoirScreen'>;

export const ManageChoirScreen = ({ navigation, route }: Props) => {
    const colors = useTheme().currentTheme;
    const role = useAuthStore((state) => state.user?.role);
    const hasAccess = canManageChoirs(role);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const selectChoir = useTargetChoirStore((state) => state.selectChoir);
    const clearSelection = useTargetChoirStore((state) => state.clearSelection);
    const {
        getChoirFromState,
        fetchChoirById,
        saveChoirAction
    } = useAdminChoirsStore();
    const choirId = route.params?.choirId;
    const isEdit = Boolean(choirId);
    const headerTitle = useMemo(() => isEdit ? 'Editar coro' : 'Nuevo coro', [isEdit]);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [imageUri, setImageUri] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({ title: headerTitle });
    }, [headerTitle, navigation]);

    useEffect(() => {
        const loadChoir = async (): Promise<void> => {
            if (!hasAccess || !choirId) {
                return;
            }

            const local = getChoirFromState(choirId);
            const choir = local ?? await fetchChoirById(choirId);

            if (!choir) {
                Alert.alert('Coro no encontrado', 'No fue posible cargar el coro solicitado.');
                navigation.goBack();
                return;
            }

            setName(choir.name);
            setCode(choir.code);
            setDescription(choir.description ?? '');
            setIsActive(choir.isActive);
            setImageUri(choir.logoUrl ?? '');
        };

        setLoading(Boolean(choirId));
        loadChoir()
            .catch(() => {
                Alert.alert('Error', 'No fue posible cargar el coro.');
            })
            .finally(() => setLoading(false));
    }, [choirId, fetchChoirById, getChoirFromState, hasAccess, navigation]);

    if (!hasAccess) {
        return <AccessDeniedScreen />;
    }

    const pickImage = async (): Promise<void> => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para seleccionar un logo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
            allowsEditing: true,
            aspect: [1, 1]
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const save = async (): Promise<void> => {
        const normalizedName = name.trim();
        const normalizedCode = code.trim().toLowerCase();

        if (!normalizedName || !normalizedCode) {
            Alert.alert('Datos incompletos', 'El nombre y el código del coro son obligatorios.');
            return;
        }

        const payload: CreateChoirPayload = {
            name: normalizedName,
            code: normalizedCode,
            description: description.trim(),
            isActive
        };

        setSaving(true);

        try {
            const savedChoir = await saveChoirAction(payload, imageUri || undefined, choirId);

            if (selectedChoir?.id === savedChoir.id) {
                if (savedChoir.isActive) {
                    selectChoir(savedChoir);
                } else {
                    clearSelection();
                }
            }

            Alert.alert('Éxito', `Coro ${isEdit ? 'actualizado' : 'creado'} correctamente.`);
            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'No fue posible guardar el coro',
                getApiErrorMessage(error as object)
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loading, { backgroundColor: colors.backgroundColor }]}>
                <ActivityIndicator size="large" color={colors.primaryColor} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets
            >
                <View style={[styles.card, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                    <Text style={[styles.title, { color: colors.textColor }]}>{headerTitle}</Text>

                    <Image
                        source={{ uri: imageUri || 'https://via.placeholder.com/150?text=Coro' }}
                        style={[styles.logo, { borderColor: colors.primaryColor }]}
                    />
                    <TouchableOpacity
                        onPress={() => void pickImage()}
                        style={[styles.imageButton, { backgroundColor: colors.buttonColor }]}
                    >
                        <Ionicons name="image-outline" size={18} color={colors.buttonTextColor} />
                        <Text style={[styles.imageButtonText, { color: colors.buttonTextColor }]}>Seleccionar logo</Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: colors.textColor }]}>Nombre</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Nombre del coro"
                        placeholderTextColor={colors.secondaryTextColor}
                        autoCorrect
                        spellCheck
                        autoCapitalize="words"
                        returnKeyType="next"
                        style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor }]}
                    />

                    <Text style={[styles.label, { color: colors.textColor }]}>Código de acceso</Text>
                    <TextInput
                        value={code}
                        onChangeText={setCode}
                        placeholder="ej. coro-centro"
                        placeholderTextColor={colors.secondaryTextColor}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        returnKeyType="next"
                        style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor }]}
                    />

                    <Text style={[styles.label, { color: colors.textColor }]}>Descripción</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Breve descripción del coro"
                        placeholderTextColor={colors.secondaryTextColor}
                        multiline
                        autoCorrect
                        spellCheck
                        autoCapitalize="sentences"
                        style={[styles.input, styles.textArea, { color: colors.textColor, borderColor: colors.borderColor }]}
                    />

                    <View style={[styles.switchRow, { borderColor: colors.borderColor }]}>
                        <View style={styles.switchText}>
                            <Text style={[styles.switchTitle, { color: colors.textColor }]}>Coro activo</Text>
                            <Text style={[styles.switchDescription, { color: colors.secondaryTextColor }]}>Los usuarios solo pueden iniciar sesión cuando el coro está activo.</Text>
                        </View>
                        <Switch value={isActive} onValueChange={setIsActive} />
                    </View>

                    <TouchableOpacity
                        onPress={() => void save()}
                        disabled={saving}
                        style={[styles.saveButton, { backgroundColor: colors.buttonColor, opacity: saving ? 0.7 : 1 }]}
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.buttonTextColor} />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={19} color={colors.buttonTextColor} />
                                <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>Guardar coro</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 18, paddingBottom: 140 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: { borderWidth: 1, borderRadius: 16, padding: 18 },
    title: { fontSize: 24, fontWeight: '900', marginBottom: 18 },
    logo: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, alignSelf: 'center', backgroundColor: '#D1D5DB' },
    imageButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, marginBottom: 12 },
    imageButtonText: { marginLeft: 7, fontWeight: '800' },
    label: { fontSize: 14, fontWeight: '800', marginTop: 14, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 18 },
    switchText: { flex: 1, paddingRight: 12 },
    switchTitle: { fontSize: 16, fontWeight: '800' },
    switchDescription: { marginTop: 3, fontSize: 12, lineHeight: 17 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, marginTop: 22 },
    saveText: { marginLeft: 8, fontSize: 16, fontWeight: '900' }
});
