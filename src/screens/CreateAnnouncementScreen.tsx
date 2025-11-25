import React, { useState, useEffect, useLayoutEffect } from 'react'; // <--- Import useLayoutEffect
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
    Image, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Announcement } from '../types/announcement';
import { useAnnouncementStore } from '../store/useAnnouncementStore';
import { useTheme } from '../context/ThemeContext';

type RootStackParamList = {
    CreateAnnouncement: { announcement?: Announcement };
};

type CreateAnnouncementRouteProp = RouteProp<RootStackParamList, 'CreateAnnouncement'>;

export const CreateAnnouncementScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<CreateAnnouncementRouteProp>();
    const { announcement } = route.params || {};

    const { addAnnouncement, editAnnouncement } = useAnnouncementStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    // --- Helper: Parse JSON to Text ---
    const extractText = (jsonContent: any): string => {
        if (!jsonContent || !jsonContent.content) return '';
        try {
            return jsonContent.content
                .map((node: any) => {
                    if (node.type === 'paragraph' && node.content) {
                        return node.content.map((textNode: any) => textNode.text).join('');
                    }
                    return '';
                })
                .join('\n');
        } catch (e) { return ''; }
    };

    // State
    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(announcement ? extractText(announcement.content) : '');
    const [imageUri, setImageUri] = useState<string | null>(announcement?.imageUrl || null);
    const [isPublic, setIsPublic] = useState(announcement?.isPublic ?? true);
    const [submitting, setSubmitting] = useState(false);

    // --- FIX: DYNAMIC HEADER CONFIGURATION ---
    useLayoutEffect(() => {
        const isEditMode = !!announcement;
        
        navigation.setOptions({
            title: isEditMode ? 'Editar Aviso' : 'Nuevo Aviso',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: 'bold' }
        });
    }, [navigation, announcement, colors]);
    // ----------------------------------------

    useEffect(() => {
        if (announcement) {
            setTitle(announcement.title);
            setContent(extractText(announcement.content));
            setImageUri(announcement.imageUrl || null);
            setIsPublic(announcement.isPublic);
        }
    }, [announcement]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("Error", "El título y el contenido son obligatorios");
            return;
        }

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
            content: richContent,
            isPublic,
            imageUri: imageUri || undefined
        };

        let success;
        if (announcement) {
            success = await editAnnouncement(announcement.id, payload);
        } else {
            success = await addAnnouncement(payload);
        }

        setSubmitting(false);

        if (success) {
            navigation.goBack();
        } else {
            Alert.alert("Error", "No se pudo guardar el aviso.");
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Image Picker */}
            <View style={styles.form}>
                <Text style={[styles.label, { color: colors.text }]}>Imagen del Aviso (Opcional)</Text>
                <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
                            <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary }}>Agregar Imagen</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.text }]}>Título</Text>
                <TextInput 
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={title} onChangeText={setTitle}
                />

                <Text style={[styles.label, { color: colors.text }]}>Contenido</Text>
                <TextInput 
                    style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                    value={content} onChangeText={setContent}
                    multiline textAlignVertical="top"
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, { color: colors.text }]}>Público</Text>
                    <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{true: colors.primary}} />
                </View>

                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: colors.button }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="white"/> : (
                        <Text style={{ color: colors.buttonText, fontWeight: 'bold' }}>
                            {announcement ? 'Actualizar' : 'Guardar'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    imageContainer: { height: 200, width: '100%', marginBottom: 20, marginTop: 10, alignSelf: 'center', borderRadius: 10, overflow: 'hidden' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    form: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    input: { borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    textArea: { height: 150 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    btn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 }
});