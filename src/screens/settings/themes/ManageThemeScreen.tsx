// src/screens/settings/themes/ManageThemeScreen.tsx

import React, { useState, useLayoutEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Modal,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../navigation/SettingsNavigator';
import {
    useCreateThemeMutation,
    useUpdateThemeMutation
} from '../../../hooks/query/useThemesData';
import { useTheme } from '../../../context/ThemeContext';
import ColorPicker, { Panel1, Preview, HueSlider } from 'reanimated-color-picker';

const normalizeHex = (raw: string): string | null => {
    if (!raw) return null;

    let value = raw.trim();
    if (!value) return null;

    if (!value.startsWith('#')) value = `#${value}`;
    const hex = value.slice(1);

    const isValidShort = /^[0-9a-fA-F]{3}$/.test(hex);
    const isValidLong = /^[0-9a-fA-F]{6}$/.test(hex);

    if (!isValidShort && !isValidLong) return null;

    if (isValidShort) {
        const h = hex.toUpperCase();
        return (
            '#' +
            h[0] + h[0] +
            h[1] + h[1] +
            h[2] + h[2]
        );
    }

    return `#${hex.toUpperCase()}`;
};

type FormColors = {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    cardColor: string;
    buttonColor: string;
    navColor: string;
    buttonTextColor: string;
    secondaryTextColor: string;
    borderColor: string;
};

type HexColorInputFieldProps = {
    label: string;
    fieldKey: keyof FormColors;
    value: string;
    textColor: string;
    borderColor: string;
    secondaryTextColor: string;
    onCommit: (field: keyof FormColors, normalizedHex: string) => void;
    onOpenPicker: () => void;
};

const HexColorInputField = React.memo(
    ({
        label,
        fieldKey,
        value,
        textColor,
        borderColor,
        secondaryTextColor,
        onCommit,
        onOpenPicker,
    }: HexColorInputFieldProps) => {
        const [inputValue, setInputValue] = useState(value);

        React.useEffect(() => {
            setInputValue(value);
        }, [value]);

        const handleEndEditing = () => {
            const normalized = normalizeHex(inputValue);

            if (!normalized) {
                Alert.alert(
                    'Color inválido',
                    'Usa un color HEX válido con el formato #RRGGBB.'
                );
                setInputValue(value);
                return;
            }

            if (normalized !== value) {
                onCommit(fieldKey, normalized);
            }
            setInputValue(normalized);
        };

        return (
            <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: textColor }]}>{label}</Text>
                    <View style={styles.hexRow}>
                        <TouchableOpacity
                            onPress={onOpenPicker}
                            style={[
                                styles.preview,
                                {
                                    backgroundColor: value,
                                },
                            ]}
                        />
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: textColor,
                                    borderColor,
                                    flex: 1,
                                },
                            ]}
                            value={inputValue}
                            onChangeText={setInputValue}
                            onEndEditing={handleEndEditing}
                            placeholder="#RRGGBB"
                            placeholderTextColor={secondaryTextColor}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                    </View>
                </View>
            </View>
        );
    }
);

export const ManageThemeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'ManageThemeScreen'>>();
    const route = useRoute<RouteProp<SettingsStackParamList, 'ManageThemeScreen'>>();
    const themeToEdit = route.params?.themeToEdit;
    const isEdit = !!themeToEdit;

    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const createThemeMutation = useCreateThemeMutation();
    const updateThemeMutation = useUpdateThemeMutation();

    const [name, setName] = useState(themeToEdit?.name || '');
    const [isDark, setIsDark] = useState(themeToEdit?.isDark || false);

    const [formColors, setFormColors] = useState<FormColors>({
        primaryColor: themeToEdit?.primaryColor || '#6200EE',
        accentColor: themeToEdit?.accentColor || '#03DAC6',
        backgroundColor: themeToEdit?.backgroundColor || '#FFFFFF',
        textColor: themeToEdit?.textColor || '#000000',
        cardColor: themeToEdit?.cardColor || '#F5F5F5',
        buttonColor: themeToEdit?.buttonColor || '#6200EE',
        navColor: themeToEdit?.navColor || '#FFFFFF',
        buttonTextColor: themeToEdit?.buttonTextColor || '#FFFFFF',
        secondaryTextColor: themeToEdit?.secondaryTextColor || '#666666',
        borderColor: themeToEdit?.borderColor || '#E0E0E0',
    });

    const [pickerVisible, setPickerVisible] = useState(false);
    const [activeField, setActiveField] = useState<keyof FormColors | null>(null);
    const [tempColor, setTempColor] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar tema' : 'Nuevo tema' });
    }, [navigation, isEdit]);

    const openPicker = useCallback(
        (field: keyof FormColors) => {
            setActiveField(field);
            setTempColor(formColors[field]);
            setPickerVisible(true);
        },
        [formColors]
    );

    const onColorSelect = (result: { hex: string }) => {
        setTempColor(result.hex);
    };

    const saveColor = () => {
        if (activeField) {
            const normalized = normalizeHex(tempColor) ?? formColors[activeField];
            setFormColors(prev => ({
                ...prev,
                [activeField]: normalized,
            }));
        }
        setPickerVisible(false);
    };

    const handleCommitHex = useCallback(
        (field: keyof FormColors, normalizedHex: string) => {
            setFormColors(prev => ({
                ...prev,
                [field]: normalizedHex,
            }));
        },
        []
    );

    const handleSave = async (): Promise<void> => {
        const normalizedName = name.trim();

        if (!normalizedName) {
            Alert.alert('Error', 'El nombre del tema es obligatorio');
            return;
        }

        const payload = { name: normalizedName, isDark, ...formColors };

        try {
            if (isEdit && themeToEdit) {
                await updateThemeMutation.mutateAsync({ id: themeToEdit.id, payload });
            } else {
                await createThemeMutation.mutateAsync(payload);
            }
            navigation.goBack();
        } catch {
            Alert.alert('Error', 'No fue posible guardar el tema. Intenta nuevamente.');
        }
    };

    const loading = createThemeMutation.isPending || updateThemeMutation.isPending;

    const colorFields = useMemo(
        () =>
            [
                { label: 'Principal (marca)', key: 'primaryColor' as const },
                { label: 'Acento (destacados)', key: 'accentColor' as const },
                { label: 'Fondo (pantalla)', key: 'backgroundColor' as const },
                { label: 'Fondo de tarjetas', key: 'cardColor' as const },
                { label: 'Barra de navegación', key: 'navColor' as const },
            ] as const,
        []
    );

    const textButtonFields = useMemo(
        () =>
            [
                { label: 'Texto principal', key: 'textColor' as const },
                { label: 'Texto secundario', key: 'secondaryTextColor' as const },
                { label: 'Fondo de botones', key: 'buttonColor' as const },
                { label: 'Texto de botones', key: 'buttonTextColor' as const },
                { label: 'Bordes y divisores', key: 'borderColor' as const },
            ] as const,
        []
    );

    return (
        <KeyboardAvoidingView
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : Platform.OS === 'android'
                        ? 'height'
                        : undefined
            }
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
                <Text style={[styles.header, { color: colors.primaryColor }]}>
                    General
                </Text>

                <Text style={[styles.label, { color: colors.textColor }]}>
                    Nombre del tema
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        { color: colors.textColor, borderColor: colors.borderColor },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Mi tema"
                    placeholderTextColor={colors.secondaryTextColor}
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.textColor }]}>
                        ¿Modo oscuro?
                    </Text>
                    <Switch
                        value={isDark}
                        onValueChange={setIsDark}
                        trackColor={{ false: '#767577', true: colors.primaryColor }}
                    />
                </View>

                <Text
                    style={[
                        styles.header,
                        { color: colors.primaryColor, marginTop: 20 },
                    ]}
                >
                    Colores principales
                </Text>

                {colorFields.map(field => (
                    <HexColorInputField
                        key={field.key}
                        label={field.label}
                        fieldKey={field.key}
                        value={formColors[field.key]}
                        textColor={colors.textColor}
                        borderColor={colors.borderColor}
                        secondaryTextColor={colors.secondaryTextColor}
                        onCommit={handleCommitHex}
                        onOpenPicker={() => openPicker(field.key)}
                    />
                ))}

                <Text
                    style={[
                        styles.header,
                        { color: colors.primaryColor, marginTop: 20 },
                    ]}
                >
                    Texto y botones
                </Text>

                {textButtonFields.map(field => (
                    <HexColorInputField
                        key={field.key}
                        label={field.label}
                        fieldKey={field.key}
                        value={formColors[field.key]}
                        textColor={colors.textColor}
                        borderColor={colors.borderColor}
                        secondaryTextColor={colors.secondaryTextColor}
                        onCommit={handleCommitHex}
                        onOpenPicker={() => openPicker(field.key)}
                    />
                ))}

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={() => void handleSave()}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveText}>Guardar tema</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={pickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.cardColor },
                        ]}
                    >
                        <Text
                            style={[
                                styles.modalTitle,
                                { color: colors.textColor },
                            ]}
                        >
                            Seleccionar color
                        </Text>

                        <ColorPicker
                            style={{ width: '100%', gap: 20 }}
                            value={tempColor}
                            onCompleteJS={onColorSelect}
                        >
                            <Preview style={styles.pickerPreview} />
                            <Panel1 style={styles.pickerPanel} />
                            <HueSlider style={styles.pickerSlider} />
                        </ColorPicker>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={() => setPickerVisible(false)}
                                style={styles.closeBtn}
                            >
                                <Text style={{ color: colors.secondaryTextColor }}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveColor}
                                style={[
                                    styles.confirmBtn,
                                    { backgroundColor: colors.buttonColor },
                                ]}
                            >
                                <Text
                                    style={{
                                        color: colors.buttonTextColor,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Seleccionar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16 },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    inputRow: { marginBottom: 15 },
    hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    preview: {
        width: 50,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    saveBtn: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    saveText: { fontWeight: 'bold', color: 'white', fontSize: 16 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', marginTop: 20, gap: 20 },
    closeBtn: { padding: 10 },
    confirmBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    pickerPanel: { borderRadius: 12, height: 150, width: '100%' },
    pickerSlider: { borderRadius: 12, height: 30, width: '100%' },
    pickerPreview: { height: 40, borderRadius: 12, width: '100%' },
});
