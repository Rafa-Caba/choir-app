import React, { useState, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Switch, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeStore } from '../../../store/useThemeStore';
import { useTheme } from '../../../context/ThemeContext';
import ColorPicker, { Panel1, Preview, HueSlider } from 'reanimated-color-picker';

export const ManageThemeScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { themeToEdit } = route.params || {};
    const isEdit = !!themeToEdit;

    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const { addTheme, editTheme } = useThemeStore();

    const [name, setName] = useState(themeToEdit?.name || '');
    const [isDark, setIsDark] = useState(themeToEdit?.isDark || false);
    const [loading, setLoading] = useState(false);

    const [formColors, setFormColors] = useState({
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

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [activeField, setActiveField] = useState<keyof typeof formColors | null>(null);
    const [tempColor, setTempColor] = useState('');

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Edit Theme' : 'New Theme' });
    }, [navigation, isEdit]);

    const openPicker = (field: keyof typeof formColors) => {
        setActiveField(field);
        setTempColor(formColors[field]); // Initialize picker with current color
        setPickerVisible(true);
    };

    const onColorSelect = (result: { hex: string }) => {
        setTempColor(result.hex);
    };

    const saveColor = () => {
        if (activeField) {
            setFormColors(prev => ({ ...prev, [activeField]: tempColor }));
        }
        setPickerVisible(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Theme Name is required");
            return;
        }

        setLoading(true);
        const payload = { name, isDark, ...formColors };

        let success;
        if (isEdit) {
            success = await editTheme(themeToEdit.id, payload);
        } else {
            success = await addTheme(payload);
        }
        setLoading(false);

        if (success) navigation.goBack();
        else Alert.alert("Error", "Failed to save theme");
    };

    const ColorInput = ({ label, field }: { label: string, field: keyof typeof formColors }) => (
        <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textColor }]}>{label}</Text>
                <View style={styles.hexRow}>
                    <TouchableOpacity onPress={() => openPicker(field)} style={[styles.preview, { backgroundColor: formColors[field] }]} />
                    <TextInput
                        style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor, flex: 1 }]}
                        value={formColors[field]}
                        onChangeText={(t) => setFormColors(prev => ({ ...prev, [field]: t }))}
                        placeholder="#RRGGBB"
                        placeholderTextColor={colors.secondaryTextColor}
                    />
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            // 🛠️ FIX: Only apply behavior on Mobile. 'undefined' lets Web scroll naturally.
            behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                style={{ flex: 1 }} // Ensure ScrollView takes available space
            >
                <Text style={[styles.header, { color: colors.primaryColor }]}>General</Text>

                <Text style={[styles.label, { color: colors.textColor }]}>Theme Name</Text>
                <TextInput
                    style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor }]}
                    value={name} onChangeText={setName} placeholder="My Theme" placeholderTextColor={colors.secondaryTextColor}
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.textColor }]}>Dark Mode?</Text>
                    <Switch value={isDark} onValueChange={setIsDark} trackColor={{ false: '#767577', true: colors.primaryColor }} />
                </View>

                <Text style={[styles.header, { color: colors.primaryColor, marginTop: 20 }]}>Core Colors</Text>
                <ColorInput label="Primary (Main Brand)" field="primaryColor" />
                <ColorInput label="Accent (Highlights)" field="accentColor" />
                <ColorInput label="Background (Page)" field="backgroundColor" />
                <ColorInput label="Card Background" field="cardColor" />
                <ColorInput label="Navigation Bar" field="navColor" />

                <Text style={[styles.header, { color: colors.primaryColor, marginTop: 20 }]}>Text & Buttons</Text>
                <ColorInput label="Main Text" field="textColor" />
                <ColorInput label="Secondary Text" field="secondaryTextColor" />
                <ColorInput label="Button Background" field="buttonColor" />
                <ColorInput label="Button Text" field="buttonTextColor" />
                <ColorInput label="Borders / Dividers" field="borderColor" />

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save Theme</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* REANIMATED COLOR PICKER MODAL */}
            <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>Pick a Color</Text>

                        <ColorPicker
                            style={{ width: '100%', gap: 20 }}
                            value={tempColor}
                            onComplete={onColorSelect}
                        >
                            <Preview style={styles.pickerPreview} />
                            <Panel1 style={styles.pickerPanel} />
                            <HueSlider style={styles.pickerSlider} />
                        </ColorPicker>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeBtn}>
                                <Text style={{ color: colors.secondaryTextColor }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveColor} style={[styles.confirmBtn, { backgroundColor: colors.buttonColor }]}>
                                <Text style={{ color: colors.buttonTextColor, fontWeight: 'bold' }}>Select</Text>
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
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    inputRow: { marginBottom: 15 },
    hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    preview: { width: 50, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
    saveBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
    saveText: { fontWeight: 'bold', color: 'white', fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 15, padding: 20, alignItems: 'center', width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', marginTop: 20, gap: 20 },
    closeBtn: { padding: 10 },
    confirmBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },

    // Library Styles
    pickerPanel: { borderRadius: 12, height: 150, width: '100%' },
    pickerSlider: { borderRadius: 12, height: 30, width: '100%' },
    pickerPreview: { height: 40, borderRadius: 12, width: '100%' }
});