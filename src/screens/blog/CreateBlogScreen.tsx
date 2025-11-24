import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
    Image, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBlogStore } from '../../store/useBlogStore';
import { useTheme } from '../../context/ThemeContext';

export const CreateBlogScreen = () => {
    const navigation = useNavigation();
    
    // Theme Hook
    const { currentTheme } = useTheme();
    
    const { addPost } = useBlogStore();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9], // Widescreen aspect ratio for blog covers
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

        setSubmitting(true);
        const success = await addPost({
            title,
            textContent: content,
            imageUri: imageUri || undefined,
            isPublic
        });
        setSubmitting(false);

        if (success) {
            Alert.alert('Éxito', 'Publicación creada correctamente.');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo crear la publicación. Inténtalo de nuevo.');
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1, backgroundColor: currentTheme.colors.background }} 
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 30}}>
            
            {/* --- Cover Image Picker --- */}
            <TouchableOpacity 
                style={[styles.imagePickerContainer, { backgroundColor: currentTheme.colors.card }]} 
                onPress={pickImage} 
                activeOpacity={0.8}
            >
                {imageUri ? (
                    <>
                        <Image source={{ uri: imageUri }} style={styles.coverImage} />
                        <View style={styles.editImageOverlay}>
                             <Ionicons name="camera" size={24} color="white" />
                             <Text style={styles.editImageText}>Cambiar Portada</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={50} color={currentTheme.colors.textSecondary} />
                        <Text style={[styles.placeholderText, { color: currentTheme.colors.textSecondary }]}>
                            Agregar Imagen de Portada
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
            {imageUri && (
                 <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                    <Text style={styles.removeImageText}>Eliminar imagen</Text>
                </TouchableOpacity>
            )}

            <View style={styles.formContainer}>
                {/* --- Title Input --- */}
                <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                    Título
                </Text>
                <TextInput
                    style={[
                        styles.input, 
                        { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border, color: currentTheme.colors.text }
                    ]}
                    placeholder="Ej. Resumen del Ensayo..."
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                {/* --- Content Input --- */}
                <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                    Contenido
                </Text>
                <TextInput
                    style={[
                        styles.input, 
                        styles.textArea,
                        { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border, color: currentTheme.colors.text }
                    ]}
                    placeholder="Escribe aquí el contenido de tu publicación..."
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />

                {/* --- Visibility Switch --- */}
                <View style={[
                    styles.switchRow, 
                    { backgroundColor: currentTheme.colors.card, borderColor: currentTheme.colors.border }
                ]}>
                    <View>
                        <Text style={[styles.switchLabel, { color: currentTheme.colors.text }]}>
                            Visibilidad
                        </Text>
                        <Text style={[styles.switchSubLabel, { color: currentTheme.colors.textSecondary }]}>
                            {isPublic ? 'Público (Visible para todos)' : 'Borrador (Solo admins)'}
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: currentTheme.colors.primary }}
                        thumbColor={isPublic ? currentTheme.colors.buttonText : "#f4f3f4"}
                        onValueChange={setIsPublic}
                        value={isPublic}
                    />
                </View>

                {/* --- Submit Button --- */}
                <TouchableOpacity 
                    style={[
                        styles.submitBtn, 
                        { backgroundColor: currentTheme.colors.button },
                        submitting && styles.submitBtnDisabled
                    ]} 
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={currentTheme.colors.buttonText} />
                    ) : (
                        <Text style={[styles.submitBtnText, { color: currentTheme.colors.buttonText }]}>
                            Publicar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Image Picker Styles
    imagePickerContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 10,
        fontWeight: '600'
    },
    editImageOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    editImageText: {
        color: 'white',
        marginLeft: 5,
        fontSize: 12,
        fontWeight: '600'
    },
    removeImageBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    removeImageText: {
        color: '#E91E63',
        fontSize: 14,
        fontWeight: '600'
    },
    // Form Styles
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    textArea: {
        height: 250, // Taller for content
    },
    // Switch Styles
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 25,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchSubLabel: {
        fontSize: 13,
        marginTop: 2
    },
    // Button Styles
    submitBtn: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        elevation: 2
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});