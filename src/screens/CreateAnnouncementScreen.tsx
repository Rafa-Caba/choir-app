import React, { useEffect, useState } from 'react';
import { 
    View, TextInput, TouchableOpacity, Text, StyleSheet, 
    Image, ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAnnouncementStore } from '../store/useAnnouncementStore';
import { getPreviewFromRichText } from '../utils/textUtils';
import { useTheme } from '../context/ThemeContext';

export const CreateAnnouncementScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    
    // Get Theme
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const { addAnnouncement, editAnnouncement, loading } = useAnnouncementStore();

    // Check if we are editing
    const editingItem = route.params?.announcement;
    const isEditMode = !!editingItem;

    const initialContent = editingItem 
        ? getPreviewFromRichText(editingItem.content, 5000) 
        : '';

    const [title, setTitle] = useState(editingItem?.title || '');
    const [content, setContent] = useState(initialContent);
    const [imageUri, setImageUri] = useState<string | undefined>(editingItem?.imageUrl);
    const [isPublic, setIsPublic] = useState(editingItem?.isPublic ?? true);

    useEffect(() => {
        navigation.setOptions({ 
            title: isEditMode ? 'Editar Aviso' : 'Nuevo Aviso',
            headerStyle: { backgroundColor: colors.background }, // Dynamic Header
            headerTintColor: colors.text,
            headerShadowVisible: false
        });
    }, [isEditMode, colors]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'El título y el contenido son obligatorios.');
            return;
        }

        const payload = {
            title,
            textContent: content,
            imageUri,
            isPublic
        };

        let success;
        if (isEditMode) {
            success = await editAnnouncement(editingItem.id, payload);
        } else {
            success = await addAnnouncement(payload);
        }

        if (success) {
            Alert.alert('Éxito', isEditMode ? 'Aviso actualizado' : 'Aviso publicado');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo guardar el aviso');
        }
    };

    // Dynamic Styles helpers
    const inputBg = currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9';
    const placeholderColor = currentTheme.isDark ? 'rgba(255,255,255,0.4)' : '#999';

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <ScrollView 
                style={[styles.container, { backgroundColor: colors.background }]} 
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                
                {/* --- Title Input --- */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Título</Text>
                    <TextInput
                        style={[styles.input, { 
                            backgroundColor: inputBg, 
                            borderColor: colors.border, 
                            color: !currentTheme.isDark ? "#000" : "#fff"
                        }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ej. Ensayo Cancelado"
                        placeholderTextColor={placeholderColor}
                    />
                </View>

                {/* --- Content Input --- */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Contenido</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { 
                            backgroundColor: inputBg, 
                            borderColor: colors.border, 
                            color: !currentTheme.isDark ? "#000" : "#fff" 
                        }]}
                        value={content}
                        onChangeText={setContent}
                        placeholder="Escribe los detalles aquí..."
                        placeholderTextColor={placeholderColor}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* --- Visibility Switch --- */}
                <View style={[styles.switchRow, { 
                    backgroundColor: inputBg, 
                    borderColor: colors.border 
                }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>Visible al público</Text>
                        <Text style={[styles.switchSubLabel, { color: colors.textSecondary }]}>
                            {isPublic ? 'Visible para todos' : 'Solo visible para Admins (Borrador)'}
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: colors.primary + "80" }} // Primary with opacity
                        thumbColor={isPublic ? colors.primary : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setIsPublic}
                        value={isPublic}
                    />
                </View>

                {/* --- Image Picker --- */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Imagen (Opcional)</Text>
                    
                    <TouchableOpacity 
                        style={[styles.imagePicker, { 
                            backgroundColor: inputBg, 
                            borderColor: colors.border 
                        }]} 
                        onPress={pickImage} 
                        activeOpacity={0.8}
                    >
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                                    Toca para subir
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {imageUri && (
                        <TouchableOpacity 
                            onPress={() => setImageUri(undefined)} 
                            style={styles.removeImageBtn}
                        >
                            <Text style={styles.removeImageText}>Eliminar imagen</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* --- Submit Button --- */}
                <TouchableOpacity 
                    style={[styles.submitBtn, { backgroundColor: colors.button }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonText} />
                    ) : (
                        <Text style={[styles.submitBtnText, { color: colors.buttonText }]}>
                            {isEditMode ? 'Guardar Cambios' : 'Publicar Aviso'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    textArea: {
        height: 150,
    },
    // Switch Styles
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchSubLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    // Image Picker Styles
    imagePicker: {
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'dashed'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 10,
    },
    removeImageBtn: {
        marginTop: 10,
        alignSelf: 'flex-end',
    },
    removeImageText: {
        color: '#E91E63',
        fontWeight: '600',
        fontSize: 14,
    },
    // Button Styles
    submitBtn: {
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    }
});