import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Make sure this is installed

import { useAuthStore } from '../../store/useAuthStore';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUserProfile, loading } = useAuthStore();    

    const [name, setName] = useState(user?.name || '');
    const [instrument, setInstrument] = useState(user?.instrument || '');
    const [bio, setBio] = useState(user?.bio || '');
    
    // Image State
    const [imageUri, setImageUri] = useState<string | undefined>(user?.imageUrl);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for profiles
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // We pass the form data AND the imageUri (if changed)
        // If imageUri starts with 'http', it means it hasn't changed, 
        // but our service handles that check gracefully.
        const success = await updateUserProfile(
            { name, instrument, bio }, 
            imageUri
        );
        
        if (success) {
            Alert.alert('Éxito', 'Perfil actualizado');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo actualizar');
        }
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* Image Picker Section */}
            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Image 
                        source={{ uri: imageUri || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }} 
                        style={styles.avatar} 
                    />
                    <View style={styles.editIconBadge}>
                        <Ionicons name="camera" size={20} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>Toca para cambiar foto</Text>
            </View>

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Instrumento</Text>
            <TextInput style={styles.input} value={instrument} onChangeText={setInstrument} />

            <Text style={styles.label}>Biografía</Text>
            <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                value={bio} 
                onChangeText={setBio} 
                multiline 
            />

            <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#8B4BFF'
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#8B4BFF',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white'
    },
    changePhotoText: {
        marginTop: 10,
        color: '#8B4BFF',
        fontWeight: '600'
    },
    label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
    btn: { backgroundColor: '#8B4BFF', padding: 15, borderRadius: 10, marginTop: 30, marginBottom: 50, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});