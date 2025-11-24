import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUserProfile, loading } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const [name, setName] = useState(user?.name || '');
    const [instrument, setInstrument] = useState(user?.instrument || '');
    const [bio, setBio] = useState(user?.bio || '');
    
    // Image State
    const [imageUri, setImageUri] = useState<string | undefined>(user?.imageUrl);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
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

    // Dynamic Styles
    const inputStyle = {
        backgroundColor: !currentTheme.isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9',
        borderColor: colors.border,
        color: colors.text,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            
            {/* Image Picker Section */}
            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Image 
                        source={{ uri: imageUri || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }} 
                        style={[styles.avatar, { borderColor: colors.primary }]} 
                    />
                    <View style={[styles.editIconBadge, { backgroundColor: colors.button }]}>
                        <Ionicons name="camera" size={20} color={colors.buttonText} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.changePhotoText, { color: colors.primary }]}>Toca para cambiar foto</Text>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre</Text>
            <TextInput 
                style={inputStyle} 
                value={name} 
                onChangeText={setName} 
                placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Instrumento</Text>
            <TextInput 
                style={inputStyle} 
                value={instrument} 
                onChangeText={setInstrument} 
                placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Biografía</Text>
            <TextInput 
                style={[inputStyle, { height: 100, textAlignVertical: 'top' }]} 
                value={bio} 
                onChangeText={setBio} 
                multiline 
                placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.button }]} 
                onPress={handleSubmit} 
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.buttonText} />
                ) : (
                    <Text style={[styles.btnText, { color: colors.buttonText }]}>Guardar Cambios</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white'
    },
    changePhotoText: {
        marginTop: 10,
        fontWeight: '600'
    },
    label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 5 },
    btn: { padding: 15, borderRadius: 10, marginTop: 30, marginBottom: 50, alignItems: 'center' },
    btnText: { fontWeight: 'bold', fontSize: 16 }
});