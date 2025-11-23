import React, { useEffect, useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeDefinition } from '../../types/theme';
import { Ionicons } from '@expo/vector-icons';
import ColorPicker, { Panel1, Swatches, Preview, HueSlider } from 'reanimated-color-picker';
import { useAdminThemesStore } from '../../store/useAdminThemesStore';

// --- HELPER COMPONENT (Moved Outside to fix focus) ---
interface ColorInputProps {
    label: string;
    field: keyof ThemeDefinition;
    value: string;
    onChange: (text: string) => void;
    onOpenPicker: () => void;
}

const ColorInput = ({ label, value, onChange, onOpenPicker }: ColorInputProps) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputRow}>
            <TouchableOpacity onPress={onOpenPicker}>
                <View style={[styles.colorPreview, { backgroundColor: value }]} />
            </TouchableOpacity>
            <TextInput 
                style={styles.input}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                maxLength={9} // #RRGGBBAA
            />
        </View>
    </View>
);

// --- MAIN COMPONENT ---
export const AdminThemeEditorScreen = () => {
    const { themes, fetchThemes, saveTheme, loading } = useAdminThemesStore();
    const { setThemeById } = useTheme(); 

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
        setForm(prev => ({ ...prev!, [key]: value }));
    };

    const openPicker = (field: keyof ThemeDefinition) => {
        if (!form) return;
        setActiveField(field);
        setTempColor(String(form[field]));
        setShowPicker(true);
    };

    const onColorSelect = (color: { hex: string }) => {
        if (activeField) {
            handleChange(activeField, color.hex);
        }
        // We don't close modal here, user hits "Done" or we let them drag
        // setTempColor(color.hex); // Update local preview if needed
    };

    const handleSave = async () => {
        if (!form || !selectedTheme) return;
        
        const success = await saveTheme(selectedTheme.id, form);
        if (success) {
            Alert.alert("Éxito", "Tema actualizado correctamente.");
            setThemeById(selectedTheme.id);
        } else {
            Alert.alert("Error", "No se pudo actualizar el tema.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Editor de Temas (Admin)</Text>
            
            {/* 1. Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
                {themes.map(t => (
                    <TouchableOpacity 
                        key={t.id}
                        onPress={() => handleSelect(t)}
                        style={[
                            styles.chip, 
                            selectedTheme?.id === t.id && styles.chipActive
                        ]}
                    >
                        <Text style={[
                            styles.chipText,
                            selectedTheme?.id === t.id && styles.chipTextActive
                        ]}>{t.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 2. Form */}
            {form ? (
                <View style={styles.form}>
                    <Text style={styles.subHeader}>Editando: {form.name}</Text>
                    
                    <ColorInput label="Color Primario" field="primaryColor" value={form.primaryColor} onChange={(t) => handleChange('primaryColor', t)} onOpenPicker={() => openPicker('primaryColor')} />
                    <ColorInput label="Color Acento" field="accentColor" value={form.accentColor} onChange={(t) => handleChange('accentColor', t)} onOpenPicker={() => openPicker('accentColor')} />
                    <ColorInput label="Fondo" field="backgroundColor" value={form.backgroundColor} onChange={(t) => handleChange('backgroundColor', t)} onOpenPicker={() => openPicker('backgroundColor')} />
                    <ColorInput label="Texto" field="textColor" value={form.textColor} onChange={(t) => handleChange('textColor', t)} onOpenPicker={() => openPicker('textColor')} />
                    <ColorInput label="Tarjetas" field="cardColor" value={form.cardColor} onChange={(t) => handleChange('cardColor', t)} onOpenPicker={() => openPicker('cardColor')} />
                    <ColorInput label="Botones" field="buttonColor" value={form.buttonColor} onChange={(t) => handleChange('buttonColor', t)} onOpenPicker={() => openPicker('buttonColor')} />
                    <ColorInput label="Navbar" field="navColor" value={form.navColor} onChange={(t) => handleChange('navColor', t)} onOpenPicker={() => openPicker('navColor')} />
                    
                    {/* Extra fields if you added them */}
                    {form.buttonTextColor && (
                         <ColorInput label="Texto Botón" field="buttonTextColor" value={form.buttonTextColor} onChange={(t) => handleChange('buttonTextColor', t)} onOpenPicker={() => openPicker('buttonTextColor')} />
                    )}

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="white"/> : <Text style={styles.saveText}>Guardar Cambios</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={{color: '#888'}}>Selecciona un tema arriba.</Text>
                </View>
            )}

            {/* 3. Color Picker Modal */}
            <Modal visible={showPicker} animationType='slide' transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Color</Text>
                        
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

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPicker(false)}>
                            <Text style={styles.closeBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    selector: { flexDirection: 'row', marginBottom: 20, height: 50 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'white', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd', height: 40, justifyContent: 'center' },
    chipActive: { backgroundColor: '#8B4BFF', borderColor: '#8B4BFF' },
    chipText: { color: '#555', fontWeight: '600' },
    chipTextActive: { color: 'white' },
    form: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 50 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#8B4BFF' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    colorPreview: { width: 40, height: 40, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
    input: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, fontFamily: 'monospace' },
    saveBtn: { backgroundColor: '#8B4BFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    emptyState: { padding: 40, alignItems: 'center' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    closeBtn: { marginTop: 20, padding: 10, backgroundColor: '#eee', borderRadius: 10, width: '100%', alignItems: 'center' },
    closeBtnText: { fontWeight: 'bold' }
});