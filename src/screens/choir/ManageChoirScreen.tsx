import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAdminChoirsStore } from '../../store/useAdminChoirsStore';
import { useTheme } from '../../context/ThemeContext';
import type { CreateChoirPayload } from '../../types/choir';

type RouteParams = { choirId?: string };

export const ManageChoirScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const params = (route.params || {}) as RouteParams;

    const isEdit = !!params.choirId;

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { getChoirFromState, fetchChoirById, saveChoirAction } = useAdminChoirsStore();

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [imageUri, setImageUri] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    const choirId = params.choirId;

    const headerTitle = useMemo(
        () => (isEdit ? 'Editar Coro' : 'Nuevo Coro'),
        [isEdit]
    );

    useEffect(() => {
        navigation.setOptions?.({ title: headerTitle });
    }, [headerTitle]);

    useEffect(() => {
        const load = async () => {
            if (!isEdit || !choirId) return;

            const local = getChoirFromState(choirId);
            if (local) {
                setName(local.name);
                setCode(local.code);
                setDescription(local.description || '');
                setIsActive(local.isActive);
                setImageUri(local.logoUrl || '');
                return;
            }

            setLoading(true);
            const fetched = await fetchChoirById(choirId);
            if (fetched) {
                setName(fetched.name);
                setCode(fetched.code);
                setDescription(fetched.description || '');
                setIsActive(fetched.isActive);
                setImageUri(fetched.logoUrl || '');
            }
            setLoading(false);
        };

        load();
    }, [isEdit, choirId]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
        }
    };

    const validate = () => {
        if (!name.trim()) return 'El nombre es obligatorio';
        if (!code.trim()) return 'El código es obligatorio';
        return null;
    };

    const onSave = async () => {
        const error = validate();
        if (error) {
            if (Platform.OS === 'web') {
                // @ts-ignore
                window.alert(error);
            } else {
                Alert.alert('Error', error);
            }
            return;
        }

        const payload: CreateChoirPayload = {
            name: name.trim(),
            code: code.trim(),
            description: description.trim() ? description.trim() : undefined,
            isActive,
        };

        setSaving(true);
        try {
            await saveChoirAction(payload, imageUri, choirId);

            const msg = `Coro ${isEdit ? 'actualizado' : 'creado'} correctamente`;
            if (Platform.OS === 'web') {
                // @ts-ignore
                window.alert(msg);
            } else {
                Alert.alert('Éxito', msg);
            }

            navigation.goBack();
        } catch (e) {
            console.error(e);
            const msg = 'No se pudo guardar el coro';
            if (Platform.OS === 'web') {
                // @ts-ignore
                window.alert(msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View
                style={[
                    styles.container,
                    { backgroundColor: colors.backgroundColor, justifyContent: 'center', alignItems: 'center' },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primaryColor} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={[styles.card, { backgroundColor: colors.cardColor }]}>
                <Text style={[styles.title, { color: colors.textColor }]}>{headerTitle}</Text>

                <View style={styles.logoRow}>
                    <View style={styles.logoWrap}>
                        <Image
                            source={{ uri: imageUri || 'https://via.placeholder.com/150?text=Coro' }}
                            style={styles.logo}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={pickImage}
                        style={[styles.pickBtn, { backgroundColor: colors.buttonColor }]}
                    >
                        <Ionicons name="image-outline" size={18} color={colors.buttonTextColor} />
                        <Text style={[styles.pickBtnText, { color: colors.buttonTextColor }]}>Cambiar logo</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Nombre *</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nombre del coro"
                    placeholderTextColor={colors.cardColor}
                    style={[
                        styles.input,
                        { backgroundColor: colors.secondaryTextColor || '#EFEFEF', color: colors.textColor },
                    ]}
                />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Código *</Text>
                <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="ej. eroc1"
                    placeholderTextColor={colors.secondaryTextColor}
                    autoCapitalize="none"
                    style={[
                        styles.input,
                        { backgroundColor: colors.cardColor || '#EFEFEF', color: colors.textColor },
                    ]}
                />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Descripción</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Breve descripción del coro"
                    placeholderTextColor={colors.secondaryTextColor}
                    multiline
                    style={[
                        styles.textarea,
                        { backgroundColor: colors.cardColor || '#EFEFEF', color: colors.textColor },
                    ]}
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.secondaryTextColor }]}>¿Coro activo?</Text>
                    <Switch value={isActive} onValueChange={setIsActive} />
                </View>

                <TouchableOpacity
                    onPress={onSave}
                    disabled={saving}
                    style={[styles.saveBtn, { backgroundColor: colors.primaryColor, opacity: saving ? 0.8 : 1 }]}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={18} color="white" />
                            <Text style={styles.saveBtnText}>Guardar</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 10 },
    card: { borderRadius: 14, padding: 16, elevation: 2 },

    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 14 },

    logoRow: { alignItems: 'center', marginBottom: 16, gap: 10 },
    logoWrap: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#DDD',
        backgroundColor: '#EEE',
    },
    logo: { width: '100%', height: '100%' },

    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
    },
    pickBtnText: { fontWeight: '800' },

    label: { fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 6 },
    input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
    textarea: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 90 },

    switchRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    saveBtn: {
        marginTop: 18,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    saveBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
