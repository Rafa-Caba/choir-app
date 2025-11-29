import React, { useState, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Image, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAnnouncementStore } from '../store/useAnnouncementStore';

export const CreateAnnouncementScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { announcement } = route.params || {};
    const isEdit = !!announcement;

    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const { addAnnouncement, editAnnouncement } = useAnnouncementStore();

    // Helper: Extract text from JSON
    const extractText = (jsonContent: any) => {
        if (!jsonContent) return '';
        try {
            if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
                return jsonContent.content.map((n: any) => n.content?.[0]?.text || '').join('\n');
            }
        } catch (e) { return ''; }
        return '';
    };

    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(isEdit ? extractText(announcement.content) : '');
    const [imageUri, setImageUri] = useState<string | null>(announcement?.imageUrl || null);
    const [isPublic, setIsPublic] = useState(announcement?.isPublic ?? true);
    const [loading, setLoading] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar Aviso' : 'Nuevo Aviso' });
    }, [navigation, isEdit]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Título y contenido obligatorios');
            return;
        }

        setLoading(true);

        // Convert to TipTap JSON
        const richContent = {
            type: 'doc',
            content: content.split('\n').map((line: string) => ({
                type: 'paragraph',
                content: line.trim() ? [{ type: 'text', text: line }] : []
            }))
        };

        const payload = {
            title,
            content: richContent,
            imageUri: imageUri || undefined,
            isPublic
        };

        let success;
        if (isEdit) {
            success = await editAnnouncement(announcement.id, payload);
        } else {
            success = await addAnnouncement(payload);
        }

        setLoading(false);

        if (success) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo guardar el aviso');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
        >
            <ScrollView contentContainerStyle={{ padding: 20 }}>

                <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.cardColor }]}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={40} color={colors.secondaryTextColor} />
                            <Text style={{ color: colors.secondaryTextColor }}>Agregar Portada</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.textColor }]}>Título</Text>
                <TextInput
                    style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor }]}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Contenido</Text>
                <TextInput
                    style={[styles.input, { height: 150, textAlignVertical: 'top', color: colors.textColor, borderColor: colors.borderColor }]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.textColor }]}>Público</Text>
                    <Switch
                        value={isPublic}
                        onValueChange={setIsPublic}
                        trackColor={{ false: "#767577", true: colors.primaryColor }}
                        thumbColor={isPublic ? colors.buttonTextColor : "#f4f3f4"}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: colors.buttonColor }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Guardar</Text>}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    imagePicker: { height: 200, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    image: { width: '100%', height: '100%', borderRadius: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    btn: { padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});