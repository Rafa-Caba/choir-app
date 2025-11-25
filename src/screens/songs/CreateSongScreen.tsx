import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSongsStore } from '../../store/useSongsStore';
import { useTheme } from '../../context/ThemeContext';

export const CreateSongScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    // preSelectedTypeId comes from the List screen "Add Button"
    const { songToEdit, preSelectedTypeId } = route.params || {}; 

    const { songTypes, addSong, editSong } = useSongsStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    // --- HELPER: Parse Tiptap JSON back to Plain Text for editing ---
    const extractTextFromTiptap = (jsonContent: any) => {
        if (!jsonContent || !jsonContent.content) return '';
        try {
            // Map each paragraph to a text line
            return jsonContent.content
                .map((node: any) => {
                    if (node.type === 'paragraph' && node.content) {
                        return node.content.map((textNode: any) => textNode.text).join('');
                    }
                    return '';
                })
                .join('\n'); // Join paragraphs with new lines
        } catch (e) {
            return '';
        }
    };

    const [title, setTitle] = useState(songToEdit?.title || '');
    const [composer, setComposer] = useState(songToEdit?.composer || '');
    
    // FIX: Initialize content using the extractor, NOT JSON.stringify
    const [content, setContent] = useState(
        songToEdit ? extractTextFromTiptap(songToEdit.content) : ''
    );
    
    // Default to preSelectedTypeId if available, otherwise first type
    const [selectedType, setSelectedType] = useState(
        songToEdit?.songTypeId || preSelectedTypeId || (songTypes[0]?.id || 0)
    );
    
    // Audio State
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [audioName, setAudioName] = useState<string | null>(songToEdit?.audioUrl ? 'Audio actual guardado' : null);
    
    const [submitting, setSubmitting] = useState(false);

    const handlePickAudio = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true
        });

        if (!result.canceled) {
            const file = result.assets[0];
            setAudioUri(file.uri);
            setAudioName(file.name);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "El título es obligatorio");
            return;
        }

        setSubmitting(true);

        // Convert Plain Text Input -> Tiptap JSON Structure
        // We split by newlines and create a paragraph for each line
        const richContent = {
            type: 'doc',
            content: content.split('\n').map((line: string) => ({
                type: 'paragraph',
                content: line.trim() ? [{ type: 'text', text: line }] : [] // Handle empty lines
            }))
        };

        const payload = {
            title,
            composer,
            content: richContent,
            songTypeId: selectedType
        };

        let success;
        if (songToEdit) {
            success = await editSong(songToEdit.id, payload, audioUri || undefined);
        } else {
            success = await addSong(payload, audioUri || undefined);
        }

        setSubmitting(false);

        if (success) {
            Alert.alert("Éxito", "Canto guardado correctamente");
            navigation.goBack();
        } else {
            Alert.alert("Error", "No se pudo guardar el canto");
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.label, { color: colors.text }]}>Título</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={title} onChangeText={setTitle} 
            />

            <Text style={[styles.label, { color: colors.text }]}>Compositor</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={composer} onChangeText={setComposer} 
            />

            <Text style={[styles.label, { color: colors.text }]}>Tipo de Canto</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                <Picker
                    selectedValue={selectedType}
                    onValueChange={(itemValue) => setSelectedType(itemValue)}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.text}
                >
                    {songTypes.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} />)}
                </Picker>
            </View>

            {/* Audio Picker */}
            <Text style={[styles.label, { color: colors.text }]}>Audio (MP3)</Text>
            <View style={styles.audioRow}>
                <TouchableOpacity 
                    style={[styles.audioBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} 
                    onPress={handlePickAudio}
                >
                    <Ionicons name="musical-note" size={20} color={colors.primary} />
                    <Text style={{ marginLeft: 10, color: colors.text }}>
                        {audioName || "Seleccionar archivo de audio..."}
                    </Text>
                </TouchableOpacity>
                {audioUri && (
                    <TouchableOpacity onPress={() => { setAudioUri(null); setAudioName(null); }}>
                        <Ionicons name="close-circle" size={24} color="#E91E63" />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Letra (Texto)</Text>
            <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={content} onChangeText={setContent} 
                multiline textAlignVertical="top"
                placeholder="Escribe la letra aquí..."
                placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: colors.button }]}
                onPress={handleSubmit}
                disabled={submitting}
            >
                {submitting ? <ActivityIndicator color="white" /> : 
                    <Text style={[styles.submitText, { color: colors.buttonText }]}>
                        {songToEdit ? 'Actualizar Canto' : 'Guardar Canto'}
                    </Text>
                }
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { height: 250 }, // Made slightly taller for lyrics
    pickerContainer: { borderRadius: 8, overflow: 'hidden' },
    audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    audioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
    submitBtn: { marginTop: 30, marginBottom: 50, padding: 15, borderRadius: 10, alignItems: 'center' },
    submitText: { fontSize: 18, fontWeight: 'bold' }
});