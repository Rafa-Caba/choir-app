import React, { useState } from 'react';
import { 
    View, TextInput, TouchableOpacity, Text, StyleSheet, 
    Image, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAnnouncementStore } from '../store/useAnnouncementStore';

export const CreateAnnouncementScreen = () => {
    const navigation = useNavigation();
    const { addAnnouncement, loading } = useAnnouncementStore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);

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

        const success = await addAnnouncement({
            title,
            textContent: content,
            imageUri,
            isPublic: true // Auto-publish for now, or add a toggle
        });

        if (success) {
            Alert.alert('Éxito', 'Aviso publicado correctamente');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo publicar el aviso');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Nuevo Aviso</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ej. Ensayo Cancelado"
                    placeholderTextColor="#999"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Contenido</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Escribe los detalles aquí..."
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Imagen (Opcional)</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="image-outline" size={40} color="#ccc" />
                            <Text style={styles.placeholderText}>Toca para subir</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Publicar Aviso</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 150,
    },
    imagePicker: {
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#aaa',
        marginTop: 10,
    },
    submitBtn: {
        backgroundColor: '#8B4BFF',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 50,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});