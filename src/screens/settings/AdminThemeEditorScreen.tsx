// src/screens/settings/AdminThemeEditorScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ColorPicker, {
    HueSlider,
    Panel1,
    Preview,
    Swatches
} from 'reanimated-color-picker';
import { useTheme } from '../../context/ThemeContext';
import {
    useThemesQuery,
    useUpdateThemeMutation
} from '../../hooks/query/useThemesData';
import type { Theme } from '../../types/theme';

type ThemeColorKey =
    | 'primaryColor'
    | 'accentColor'
    | 'backgroundColor'
    | 'textColor'
    | 'cardColor'
    | 'buttonColor'
    | 'navColor'
    | 'buttonTextColor'
    | 'secondaryTextColor'
    | 'borderColor';

interface ColorFieldDefinition {
    readonly label: string;
    readonly key: ThemeColorKey;
}

interface ColorInputProps {
    readonly label: string;
    readonly value: string;
    readonly onChange: (text: string) => void;
    readonly onOpenPicker: () => void;
    readonly colors: Theme;
}

const COLOR_FIELDS: readonly ColorFieldDefinition[] = [
    { label: 'Color principal', key: 'primaryColor' },
    { label: 'Color de acento', key: 'accentColor' },
    { label: 'Fondo', key: 'backgroundColor' },
    { label: 'Texto', key: 'textColor' },
    { label: 'Tarjetas', key: 'cardColor' },
    { label: 'Botones', key: 'buttonColor' },
    { label: 'Barra de navegación', key: 'navColor' },
    { label: 'Texto de botones', key: 'buttonTextColor' },
    { label: 'Texto secundario', key: 'secondaryTextColor' },
    { label: 'Bordes', key: 'borderColor' }
];

const normalizeHex = (value: string): string | null => {
    const trimmed = value.trim();
    const candidate = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    return /^#[0-9A-Fa-f]{6}$/u.test(candidate)
        ? candidate.toUpperCase()
        : null;
};

const ColorInput = ({
    label,
    value,
    onChange,
    onOpenPicker,
    colors
}: ColorInputProps) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textColor }]}>{label}</Text>
        <View style={styles.inputRow}>
            <TouchableOpacity onPress={onOpenPicker} activeOpacity={0.75}>
                <View
                    style={[
                        styles.colorPreview,
                        {
                            backgroundColor: normalizeHex(value) ?? '#FFFFFF',
                            borderColor: colors.borderColor
                        }
                    ]}
                />
            </TouchableOpacity>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.backgroundColor,
                        borderColor: colors.borderColor,
                        color: colors.textColor
                    }
                ]}
                value={value}
                onChangeText={onChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                returnKeyType="done"
            />
        </View>
    </View>
);

export const AdminThemeEditorScreen = () => {
    const themesQuery = useThemesQuery();
    const updateThemeMutation = useUpdateThemeMutation();
    const { currentTheme, setTheme } = useTheme();
    const colors = currentTheme;
    const themes = themesQuery.data ?? [];
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
    const [form, setForm] = useState<Theme | null>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [activeField, setActiveField] = useState<ThemeColorKey | null>(null);
    const [tempColor, setTempColor] = useState('#FFFFFF');

    const selectedTheme = useMemo(
        () => themes.find((theme) => theme.id === selectedThemeId) ?? null,
        [selectedThemeId, themes]
    );

    useEffect(() => {
        if (!selectedThemeId && themes.length > 0) {
            setSelectedThemeId(themes[0].id);
            setForm({ ...themes[0] });
            return;
        }

        if (selectedTheme && form?.id !== selectedTheme.id) {
            setForm({ ...selectedTheme });
        }
    }, [form?.id, selectedTheme, selectedThemeId, themes]);

    const handleSelect = (theme: Theme): void => {
        setSelectedThemeId(theme.id);
        setForm({ ...theme });
    };

    const handleColorChange = (key: ThemeColorKey, value: string): void => {
        setForm((current) => current ? { ...current, [key]: value } : current);
    };

    const openPicker = (field: ThemeColorKey): void => {
        if (!form) {
            return;
        }

        setActiveField(field);
        setTempColor(normalizeHex(form[field]) ?? '#FFFFFF');
        setPickerVisible(true);
    };

    const handleSave = async (): Promise<void> => {
        if (!form) {
            return;
        }

        const invalidField = COLOR_FIELDS.find((field) => !normalizeHex(form[field.key]));

        if (invalidField) {
            Alert.alert('Color inválido', `Revisa el campo: ${invalidField.label}.`);
            return;
        }

        try {
            const updated = await updateThemeMutation.mutateAsync({
                id: form.id,
                payload: {
                    name: form.name.trim(),
                    isDark: form.isDark,
                    primaryColor: form.primaryColor,
                    accentColor: form.accentColor,
                    backgroundColor: form.backgroundColor,
                    textColor: form.textColor,
                    cardColor: form.cardColor,
                    buttonColor: form.buttonColor,
                    navColor: form.navColor,
                    buttonTextColor: form.buttonTextColor,
                    secondaryTextColor: form.secondaryTextColor,
                    borderColor: form.borderColor
                }
            });
            setForm({ ...updated });

            if (currentTheme.id === updated.id) {
                setTheme(updated);
            }

            Alert.alert('Éxito', 'Tema actualizado correctamente.');
        } catch {
            Alert.alert('Error', 'No se pudo actualizar el tema. Intenta nuevamente.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.flexOne, { backgroundColor: colors.backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
                <Text style={[styles.header, { color: colors.textColor }]}>Editor de temas</Text>

                {themesQuery.isLoading ? (
                    <ActivityIndicator color={colors.primaryColor} style={styles.status} />
                ) : themesQuery.isError ? (
                    <View style={styles.status}>
                        <Text style={{ color: colors.secondaryTextColor }}>No fue posible cargar los temas.</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void themesQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
                            {themes.map((theme) => (
                                <TouchableOpacity
                                    key={theme.id}
                                    onPress={() => handleSelect(theme)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: selectedThemeId === theme.id
                                                ? colors.primaryColor
                                                : colors.cardColor,
                                            borderColor: selectedThemeId === theme.id
                                                ? colors.primaryColor
                                                : colors.borderColor
                                        }
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: selectedThemeId === theme.id
                                                ? colors.buttonTextColor
                                                : colors.textColor,
                                            fontWeight: '600'
                                        }}
                                    >
                                        {theme.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {form ? (
                            <View style={[styles.form, { backgroundColor: colors.cardColor }]}>
                                <Text style={[styles.subHeader, { color: colors.textColor }]}>Editando: {form.name}</Text>
                                {COLOR_FIELDS.map((field) => (
                                    <ColorInput
                                        key={field.key}
                                        label={field.label}
                                        value={form[field.key]}
                                        onChange={(value) => handleColorChange(field.key, value)}
                                        onOpenPicker={() => openPicker(field.key)}
                                        colors={colors}
                                    />
                                ))}

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.buttonColor }]}
                                    onPress={() => void handleSave()}
                                    disabled={updateThemeMutation.isPending}
                                >
                                    {updateThemeMutation.isPending ? (
                                        <ActivityIndicator color={colors.buttonTextColor} />
                                    ) : (
                                        <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>Guardar cambios</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </>
                )}
            </ScrollView>

            <Modal
                visible={pickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>Seleccionar color</Text>
                        <ColorPicker
                            style={styles.picker}
                            value={tempColor}
                            onCompleteJS={(result) => setTempColor(result.hex)}
                        >
                            <Preview />
                            <Panel1 />
                            <HueSlider />
                            <Swatches />
                        </ColorPicker>
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalButton}>
                                <Text style={{ color: colors.secondaryTextColor }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.buttonColor }]}
                                onPress={() => {
                                    if (activeField) {
                                        handleColorChange(activeField, normalizeHex(tempColor) ?? tempColor);
                                    }
                                    setPickerVisible(false);
                                }}
                            >
                                <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Seleccionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: { padding: 20, paddingBottom: 50 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    selector: { marginBottom: 20, maxHeight: 50 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        height: 40,
        justifyContent: 'center'
    },
    form: { padding: 20, borderRadius: 15 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, marginBottom: 5 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    colorPreview: { width: 40, height: 40, borderRadius: 8, marginRight: 10, borderWidth: 1 },
    input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: 'monospace' },
    saveButton: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveText: { fontWeight: 'bold', fontSize: 16 },
    status: { paddingVertical: 50, alignItems: 'center' },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    picker: { width: '100%', gap: 18 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
    modalButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 }
});
