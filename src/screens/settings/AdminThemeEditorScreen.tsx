import React, { useEffect, useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeDefinition } from '../../types/theme';
import ColorPicker, { Panel1, Swatches, Preview, HueSlider } from 'reanimated-color-picker';
import { useAdminThemesStore } from '../../store/useAdminThemesStore';

// --- HELPER COMPONENT (Moved Outside) ---
interface ColorInputProps {
    label: string;
    field: keyof ThemeDefinition;
    value: string;
    onChange: (text: string) => void;
    onOpenPicker: () => void;
    colors: any; // Pass theme colors for styling
}

const ColorInput = ({ label, value, onChange, onOpenPicker, colors }: ColorInputProps) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textColor }]}>{label}</Text>
        <View style={styles.inputRow}>
            <TouchableOpacity onPress={onOpenPicker}>
                <View style={[styles.colorPreview, { backgroundColor: value || '#fff', borderColor: colors.borderColor }]} />
            </TouchableOpacity>
            <TextInput 
                style={[styles.input, { 
                    backgroundColor: colors.backgroundColor, 
                    borderColor: colors.borderColor,
                    color: colors.textColor 
                }]}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                maxLength={9} 
            />
        </View>
    </View>
);

// --- MAIN COMPONENT ---
export const AdminThemeEditorScreen = () => {
    const { themes, fetchThemes, saveTheme, loading } = useAdminThemesStore();
    
    // 🎨 Theme Fix: Flat structure
    const { setThemeById, currentTheme } = useTheme(); 
    const colors = currentTheme;

    const [selectedTheme, setSelectedTheme] = useState<ThemeDefinition | null>(null);
    const [form, setForm] = useState<ThemeDefinition | null>(null);
    
    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [activeField, setActiveField] = useState<keyof ThemeDefinition | null>(null);
    const [tempColor, setTempColor] = useState('#ffffff');

    useEffect(() => {
        fetchThemes();
    }, []);

    const handleSelect = (theme: ThemeDefinition) => {
        setSelectedTheme(theme);
        setForm({ ...theme });
    };

    const handleChange = (key: keyof ThemeDefinition, value: string) => {
        if (!form) return;
        // @ts-ignore
        setForm(prev => ({ ...prev!, [key]: value }));
    };

    const openPicker = (field: keyof ThemeDefinition) => {
        if (!form) return;
        setActiveField(field);
        setTempColor(String(form[field]) || '#ffffff');
        setShowPicker(true);
    };

    const onColorSelect = (color: { hex: string }) => {
        if (activeField) {
            handleChange(activeField, color.hex);
        }
    };

    const handleSave = async () => {
        if (!form || !selectedTheme) return;
        
        // Pass String ID to store
        const success = await saveTheme(selectedTheme.id, form);
        if (success) {
            Alert.alert("Éxito", "Tema actualizado correctamente.");
            setThemeById(selectedTheme.id);
        } else {
            Alert.alert("Error", "No se pudo actualizar el tema.");
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <Text style={[styles.header, { color: colors.textColor }]}>Editor de Temas (Admin)</Text>
            
            {/* 1. Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
                {themes.map(t => (
                    <TouchableOpacity 
                        key={t.id}
                        onPress={() => handleSelect(t)}
                        style={[
                            styles.chip, 
                            { backgroundColor: colors.cardColor, borderColor: colors.borderColor },
                            selectedTheme?.id === t.id && { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }
                        ]}
                    >
                        <Text style={[
                            styles.chipText,
                            { color: colors.textColor },
                            selectedTheme?.id === t.id && { color: colors.buttonTextColor }
                        ]}>{t.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 2. Form */}
            {form ? (
                <View style={[styles.form, { backgroundColor: colors.cardColor }]}>
                    <Text style={[styles.subHeader, { color: colors.textColor }]}>Editando: {form.name}</Text>
                    
                    <ColorInput label="Color Primario" field="primaryColor" value={form.primaryColor} onChange={(t) => handleChange('primaryColor', t)} onOpenPicker={() => openPicker('primaryColor')} colors={colors} />
                    <ColorInput label="Color Acento" field="accentColor" value={form.accentColor} onChange={(t) => handleChange('accentColor', t)} onOpenPicker={() => openPicker('accentColor')} colors={colors} />
                    <ColorInput label="Fondo" field="backgroundColor" value={form.backgroundColor} onChange={(t) => handleChange('backgroundColor', t)} onOpenPicker={() => openPicker('backgroundColor')} colors={colors} />
                    <ColorInput label="Texto" field="textColor" value={form.textColor} onChange={(t) => handleChange('textColor', t)} onOpenPicker={() => openPicker('textColor')} colors={colors} />
                    <ColorInput label="Tarjetas" field="cardColor" value={form.cardColor} onChange={(t) => handleChange('cardColor', t)} onOpenPicker={() => openPicker('cardColor')} colors={colors} />
                    <ColorInput label="Botones" field="buttonColor" value={form.buttonColor} onChange={(t) => handleChange('buttonColor', t)} onOpenPicker={() => openPicker('buttonColor')} colors={colors} />
                    <ColorInput label="Navbar" field="navColor" value={form.navColor} onChange={(t) => handleChange('navColor', t)} onOpenPicker={() => openPicker('navColor')} colors={colors} />
                    
                    {/* Extra fields */}
                    <ColorInput label="Texto Botón" field="buttonTextColor" value={form.buttonTextColor || ''} onChange={(t) => handleChange('buttonTextColor', t)} onOpenPicker={() => openPicker('buttonTextColor')} colors={colors} />
                    <ColorInput label="Texto Secundario" field="secondaryTextColor" value={form.secondaryTextColor || ''} onChange={(t) => handleChange('secondaryTextColor', t)} onOpenPicker={() => openPicker('secondaryTextColor')} colors={colors} />
                    <ColorInput label="Bordes" field="borderColor" value={form.borderColor || ''} onChange={(t) => handleChange('borderColor', t)} onOpenPicker={() => openPicker('borderColor')} colors={colors} />

                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]} 
                        onPress={handleSave} 
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.buttonTextColor || '#fff'} />
                        ) : (
                            <Text style={[styles.saveText, { color: colors.buttonTextColor || '#fff' }]}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={{ color: colors.secondaryTextColor || colors.textColor }}>Selecciona un tema arriba para editar.</Text>
                </View>
            )}

            {/* 3. Color Picker Modal */}
            <Modal visible={showPicker} animationType='slide' transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>Seleccionar Color</Text>
                        
                        <ColorPicker 
                            style={{ width: '100%', height: 300 }} 
                            value={tempColor}
                            onComplete={onColorSelect}
                        >
                            <Preview />
                            <Panel1 />
                            <HueSlider />
                            <Swatches />
                        </ColorPicker>

                        <TouchableOpacity 
                            style={[styles.closeBtn, { backgroundColor: colors.backgroundColor }]} 
                            onPress={() => setShowPicker(false)}
                        >
                            <Text style={[styles.closeBtnText, { color: colors.textColor }]}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    selector: { flexDirection: 'row', marginBottom: 20, height: 50 },
    chip: { 
        paddingHorizontal: 16, paddingVertical: 8, 
        borderRadius: 20, marginRight: 10, 
        borderWidth: 1, height: 40, justifyContent: 'center' 
    },
    chipText: { fontWeight: '600' },
    form: { padding: 20, borderRadius: 15, marginBottom: 50 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, marginBottom: 5 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    colorPreview: { 
        width: 40, height: 40, borderRadius: 8, marginRight: 10, 
        borderWidth: 1
    },
    input: { 
        flex: 1, borderWidth: 1, borderRadius: 8, 
        padding: 10, fontSize: 16, fontFamily: 'monospace'
    },
    saveBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveText: { fontWeight: 'bold', fontSize: 16 },
    emptyState: { padding: 40, alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 20, alignItems: 'center', width: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    closeBtn: { marginTop: 20, padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
    closeBtnText: { fontWeight: 'bold' }
});