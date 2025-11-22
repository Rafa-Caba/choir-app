import React, { useEffect, useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext'; // To force app refresh
import type { ThemeDefinition } from '../../types/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAdminThemesStore } from '../../store/useAdminThemesStore';

export const AdminThemeEditorScreen = () => {
    const { themes, fetchThemes, saveTheme, loading } = useAdminThemesStore();
    // We grab the context function to refresh the global app theme after saving
    const { setThemeById } = useTheme(); 

    const [selectedTheme, setSelectedTheme] = useState<ThemeDefinition | null>(null);
    const [form, setForm] = useState<ThemeDefinition | null>(null);

    useEffect(() => {
        fetchThemes();
    }, []);

    // When a theme is selected, populate the form
    const handleSelect = (theme: ThemeDefinition) => {
        setSelectedTheme(theme);
        setForm({ ...theme }); // Clone
    };

    const handleChange = (key: keyof ThemeDefinition, value: string) => {
        if (!form) return;
        setForm({ ...form, [key]: value });
    };

    const handleSave = async () => {
        if (!form || !selectedTheme) return;
        
        const success = await saveTheme(selectedTheme.id, form);
        if (success) {
            Alert.alert("Éxito", "Tema actualizado correctamente.");
            // Force global context to refresh this theme if it's active
            setThemeById(selectedTheme.id);
        } else {
            Alert.alert("Error", "No se pudo actualizar el tema.");
        }
    };

    // Helper for Color Input
    const ColorInput = ({ label, field }: { label: string, field: keyof ThemeDefinition }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
                <View style={[styles.colorPreview, { backgroundColor: String(form?.[field]) }]} />
                <TextInput 
                    style={styles.input}
                    value={String(form?.[field])}
                    onChangeText={(text) => handleChange(field, text)}
                    autoCapitalize="none"
                />
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Editor de Temas (Admin)</Text>
            
            {/* 1. Selector List */}
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

            {/* 2. Editor Form */}
            {form ? (
                <View style={styles.form}>
                    <Text style={styles.subHeader}>Editando: {form.name}</Text>
                    
                    <ColorInput label="Color Primario" field="primaryColor" />
                    <ColorInput label="Color Acento" field="accentColor" />
                    <ColorInput label="Fondo (Background)" field="backgroundColor" />
                    <ColorInput label="Texto" field="textColor" />
                    <ColorInput label="Tarjetas (Cards)" field="cardColor" />
                    <ColorInput label="Botones" field="buttonColor" />
                    <ColorInput label="Barra de Navegación" field="navColor" />

                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white"/> : <Text style={styles.saveText}>Guardar Cambios</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={{color: '#888'}}>Selecciona un tema arriba para editar sus colores.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    selector: { flexDirection: 'row', marginBottom: 20, height: 50 },
    chip: { 
        paddingHorizontal: 16, paddingVertical: 8, 
        backgroundColor: 'white', borderRadius: 20, 
        marginRight: 10, borderWidth: 1, borderColor: '#ddd',
        height: 40, justifyContent: 'center'
    },
    chipActive: { backgroundColor: '#8B4BFF', borderColor: '#8B4BFF' },
    chipText: { color: '#555', fontWeight: '600' },
    chipTextActive: { color: 'white' },
    
    form: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 50 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#8B4BFF' },
    
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    colorPreview: { 
        width: 40, height: 40, borderRadius: 8, marginRight: 10, 
        borderWidth: 1, borderColor: '#eee' 
    },
    input: { 
        flex: 1, backgroundColor: '#f9f9f9', 
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, 
        padding: 10, fontSize: 16, fontFamily: 'monospace'
    },
    
    saveBtn: { 
        backgroundColor: '#8B4BFF', padding: 15, 
        borderRadius: 10, alignItems: 'center', marginTop: 10 
    },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    emptyState: { padding: 40, alignItems: 'center' }
});