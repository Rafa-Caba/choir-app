import React, { useState, useEffect } from 'react';
import { 
    View, TextInput, TouchableOpacity, Text, StyleSheet, 
    Alert, ScrollView, Modal, FlatList, ActivityIndicator, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Store & Context
import { useSongsStore } from '../../store/useSongsStore';
import { useTheme } from '../../context/ThemeContext';

export const CreateSongScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
    // Theme
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const { addSong, songTypes, fetchData, loading } = useSongsStore();

    // Form State
    const [title, setTitle] = useState('');
    const [composer, setComposer] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    
    // UI State
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Song Types on mount (if empty)
    useEffect(() => {
        if (songTypes.length === 0) {
            fetchData();
        }
    }, []);

    const selectedTypeName = songTypes.find(t => t.id === selectedTypeId)?.name || 'Seleccionar Tipo';

    const handleSubmit = async () => {
        if (!title.trim() || !lyrics.trim() || !selectedTypeId) {
            Alert.alert("Faltan datos", "Por favor completa Título, Letra y selecciona un Tipo.");
            return;
        }

        setIsSubmitting(true);

        // Convert plain text lyrics to the JSONB structure backend expects
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

    // Styles for dynamic inputs
    const inputStyle = {
        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9',
        borderColor: colors.border,
        color: colors.text,
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    };

    const placeholderColor = currentTheme.isDark ? 'rgba(255,255,255,0.4)' : '#aaa';

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            
            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Nuevo Canto</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* Title Input */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
                    <TextInput
                        style={inputStyle}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ej. Pescador de Hombres"
                        placeholderTextColor={placeholderColor}
                    />
                </View>

                {/* Composer Input */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Compositor (Opcional)</Text>
                    <TextInput
                        style={inputStyle}
                        value={composer}
                        onChangeText={setComposer}
                        placeholder="Ej. Cesáreo Gabaráin"
                        placeholderTextColor={placeholderColor}
                    />
                </View>

                {/* Type Selector (Custom Picker) */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Canto</Text>
                    <TouchableOpacity 
                        style={[styles.pickerTrigger, { 
                            backgroundColor: inputStyle.backgroundColor, 
                            borderColor: colors.border 
                        }]} 
                        onPress={() => setPickerVisible(true)}
                    >
                        <Text style={{ color: selectedTypeId ? colors.text : placeholderColor, fontSize: 16 }}>
                            {selectedTypeName}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Lyrics Input */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Letra</Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={lyrics}
                        onChangeText={setLyrics}
                        placeholder="Escribe la letra aquí..."
                        placeholderTextColor={placeholderColor}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[
                        styles.submitBtn, 
                        { backgroundColor: colors.button },
                        isSubmitting && styles.submitBtnDisabled
                    ]} 
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={colors.buttonText} />
                    ) : (
                        <Text style={[styles.submitBtnText, { color: colors.buttonText }]}>Guardar Canto</Text>
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
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona un Tipo</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        {loading && <ActivityIndicator style={{margin: 20}} color={colors.primary}/>}

                        <FlatList 
                            data={songTypes}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedTypeId(item.id);
                                        setPickerVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText, 
                                        { color: colors.text },
                                        selectedTypeId === item.id && { color: colors.primary, fontWeight: 'bold' }
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {selectedTypeId === item.id && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
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
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 5, marginTop: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
    scrollContent: { padding: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    textArea: { height: 200 },
    pickerTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
    },
    submitBtn: {
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 50,
        elevation: 2
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { fontSize: 18, fontWeight: 'bold' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
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
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalItem: {
        padding: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalItemText: { fontSize: 16 }
});