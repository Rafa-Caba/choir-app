import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSongsStore } from '../../store/useSongsStore';
import { useTheme } from '../../context/ThemeContext';
import { TypeSelectorModal } from '../../components/song/TypeSelectorModal';


export const CreateSongScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { songToEdit, preSelectedTypeId } = route.params || {};
    const isEdit = !!songToEdit;

    const { songTypes, addSong, editSong, fetchData } = useSongsStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    useEffect(() => {
        if (songTypes.length === 0) fetchData();
    }, []);

    const extractText = (jsonContent: any) => {
        if (!jsonContent) return '';
        try {
            if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
                return jsonContent.content.map((n: any) => n.content?.[0]?.text || '').join('\n');
            }
        } catch (e) { return ''; }
        return '';
    };

    const [title, setTitle] = useState(songToEdit?.title || '');
    const [composer, setComposer] = useState(songToEdit?.composer || '');
    const [content, setContent] = useState(isEdit ? extractText(songToEdit.content) : '');

    // Type State
    const [selectedType, setSelectedType] = useState<string | null>(songToEdit?.songTypeId || preSelectedTypeId || null);
    const [selectedTypeName, setSelectedTypeName] = useState('');
    const [showTypeModal, setShowTypeModal] = useState(false);

    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [audioName, setAudioName] = useState<string | null>(songToEdit?.audioUrl ? 'Existing Audio Saved' : null);
    const [submitting, setSubmitting] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar Canto' : 'Nuevo Canto' });
    }, [navigation, isEdit]);

    // Sync selectedTypeName when types load or selection changes
    useEffect(() => {
        if (selectedType && songTypes.length > 0) {
            const found = songTypes.find(t => t.id === selectedType);
            if (found) setSelectedTypeName(found.name);
        } else if (!selectedType) {
            setSelectedTypeName('Selecciona una Categoría');
        }
    }, [selectedType, songTypes]);

    const handlePickAudio = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
            if (!result.canceled) {
                setAudioUri(result.assets[0].uri);
                setAudioName(result.assets[0].name);
            }
        } catch (e) { Alert.alert("Error", "Audio selection failed"); }
    };

    const handleSubmit = async () => {
        if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
        if (!selectedType) { Alert.alert("Error", "Select a song type"); return; }

        setSubmitting(true);

        const richContent = {
            type: 'doc',
            content: content.split('\n').map((line: string) => ({
                type: 'paragraph',
                content: line.trim() ? [{ type: 'text', text: line }] : []
            }))
        };

        const payload = {
            title,
            composer,
            content: richContent,
            songTypeId: selectedType
        };

        let success;
        if (isEdit) {
            success = await editSong(songToEdit.id, payload, audioUri || undefined);
        } else {
            success = await addSong(payload, audioUri || undefined);
        }

        setSubmitting(false);

        if (success) {
            navigation.goBack();
        } else {
            Alert.alert("Error", "Could not save song.");
        }
    };

    // Style Helper
    const inputStyle = [styles.input, { backgroundColor: colors.cardColor, color: colors.textColor }];

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.backgroundColor }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>

                <Text style={[styles.label, { color: colors.textColor }]}>Título</Text>
                <TextInput style={inputStyle} value={title} onChangeText={setTitle} />

                <Text style={[styles.label, { color: colors.textColor }]}>Compositor</Text>
                <TextInput style={inputStyle} value={composer} onChangeText={setComposer} />

                {/* 🆕 CUSTOM SELECTOR BUTTON */}
                <Text style={[styles.label, { color: colors.textColor }]}>Categoría</Text>
                <TouchableOpacity
                    style={[inputStyle, styles.selectorBtn]}
                    onPress={() => setShowTypeModal(true)}
                >
                    <Text style={{ color: selectedType ? colors.textColor : colors.secondaryTextColor }}>
                        {selectedTypeName}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondaryTextColor} />
                </TouchableOpacity>

                <TypeSelectorModal
                    visible={showTypeModal}
                    onClose={() => setShowTypeModal(false)}
                    allTypes={songTypes}
                    selectedTypeId={selectedType}
                    onSelect={(id, name) => {
                        setSelectedType(id);
                        setSelectedTypeName(name);
                    }}
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Audio</Text>
                <View style={styles.audioRow}>
                    <TouchableOpacity style={[styles.audioBtn, { backgroundColor: colors.cardColor, borderColor: colors.primaryColor }]} onPress={handlePickAudio}>
                        <Ionicons name="musical-note" size={20} color={colors.primaryColor} />
                        <Text style={{ marginLeft: 10, color: colors.textColor }}>{audioName || "Selecciona un audio..."}</Text>
                    </TouchableOpacity>
                    {audioUri && (
                        <TouchableOpacity onPress={() => { setAudioUri(null); setAudioName(null); }}>
                            <Ionicons name="close-circle" size={24} color="#E91E63" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.label, { color: colors.textColor }]}>Letra</Text>
                <TextInput
                    style={[inputStyle, styles.textArea]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    placeholder="Escribe la letra aquí..."
                    placeholderTextColor={colors.secondaryTextColor}
                />

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.buttonColor }]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="white" /> : <Text style={[styles.submitText, { color: colors.buttonTextColor }]}>{isEdit ? 'Update Song' : 'Save Song'}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { borderRadius: 8, padding: 12, fontSize: 16 },
    selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    textArea: { height: 250 },
    audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    audioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
    submitBtn: { marginTop: 30, marginBottom: 50, padding: 15, borderRadius: 10, alignItems: 'center' },
    submitText: { fontSize: 18, fontWeight: 'bold' }
});