import React, { useState, useEffect } from 'react';
import { 
    View, TextInput, TouchableOpacity, Text, StyleSheet, 
    Alert, ScrollView, Modal, FlatList, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Store
import { useSongsStore } from '../../store/useSongsStore';

export const CreateSongScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
    const { addSong, songTypes, fetchData, loading } = useSongsStore();

    // Form State
    const [title, setTitle] = useState('');
    const [composer, setComposer] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    
    // UI State for the Picker Modal
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Song Types on mount (if empty)
    useEffect(() => {
        if (songTypes.length === 0) {
            fetchData();
        }
    }, []);

    // Helper to get the name of the selected type
    const selectedTypeName = songTypes.find(t => t.id === selectedTypeId)?.name || 'Seleccionar Tipo';

    const handleSubmit = async () => {
        if (!title.trim() || !lyrics.trim() || !selectedTypeId) {
            Alert.alert("Faltan datos", "Por favor completa Título, Letra y selecciona un Tipo.");
            return;
        }

        setIsSubmitting(true);

        // Convert plain text lyrics to the JSONB structure backend expects
        // We split by newline to create paragraphs
        const paragraphs = lyrics.split('\n').map(line => ({
            type: "paragraph",
            content: line.trim() ? [{ type: "text", text: line }] : []
        }));

        const richContent = {
            type: "doc",
            content: paragraphs
        };

        const success = await addSong({
            title,
            composer,
            content: richContent,
            songTypeId: selectedTypeId
        });

        setIsSubmitting(false);

        if (success) {
            Alert.alert("Éxito", "Canto guardado correctamente");
            navigation.goBack();
        } else {
            Alert.alert("Error", "No se pudo guardar el canto");
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nuevo Canto</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* Title Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Título</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ej. Pescador de Hombres"
                        placeholderTextColor="#aaa"
                    />
                </View>

                {/* Composer Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Compositor (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={composer}
                        onChangeText={setComposer}
                        placeholder="Ej. Cesáreo Gabaráin"
                        placeholderTextColor="#aaa"
                    />
                </View>

                {/* Type Selector (Custom Picker) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tipo de Canto</Text>
                    <TouchableOpacity 
                        style={styles.pickerTrigger} 
                        onPress={() => setPickerVisible(true)}
                    >
                        <Text style={{ color: selectedTypeId ? '#333' : '#aaa', fontSize: 16 }}>
                            {selectedTypeName}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Lyrics Input */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Letra</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={lyrics}
                        onChangeText={setLyrics}
                        placeholder="Escribe la letra aquí..."
                        placeholderTextColor="#aaa"
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitBtnText}>Guardar Canto</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* --- Modal for Selecting Song Type --- */}
            <Modal
                visible={isPickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecciona un Tipo</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        {loading && <ActivityIndicator style={{margin: 20}} color="#8B4BFF"/>}

                        <FlatList 
                            data={songTypes}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedTypeId(item.id);
                                        setPickerVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText, 
                                        selectedTypeId === item.id && styles.modalItemTextSelected
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {selectedTypeId === item.id && (
                                        <Ionicons name="checkmark" size={20} color="#8B4BFF" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backBtn: { padding: 5, marginTop: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
    scrollContent: { padding: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 8 },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#333',
    },
    textArea: { height: 200 },
    pickerTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
    },
    submitBtn: {
        backgroundColor: '#8B4BFF',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 50,
        elevation: 2
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 30
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalItemText: { fontSize: 16, color: '#333' },
    modalItemTextSelected: { color: '#8B4BFF', fontWeight: 'bold' }
});