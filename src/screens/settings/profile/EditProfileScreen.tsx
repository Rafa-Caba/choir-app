// src/screens/settings/profile/EditProfileScreen.tsx

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../store/useAuthStore';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUserProfile, loading } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const [name, setName] = useState(user?.name ?? '');
    const [instrumentLabel, setInstrumentLabel] = useState(
        user?.instrumentLabel ?? user?.instrument ?? ''
    );
    const [bio, setBio] = useState(user?.bio ?? '');
    const [imageUri, setImageUri] = useState<string | undefined>(
        user?.cachedImageUrl ?? user?.imageUrl
    );

    const pickImage = async (): Promise<void> => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5
        });

        if (!result.canceled) {
            const selectedAsset = result.assets[0];

            if (selectedAsset) {
                setImageUri(selectedAsset.uri);
            }
        }
    };

    const handleSubmit = async (): Promise<void> => {
        const normalizedName = name.trim();

        if (!normalizedName) {
            Alert.alert('Nombre requerido', 'Ingresa tu nombre antes de guardar.');
            return;
        }

        const success = await updateUserProfile(
            {
                name: normalizedName,
                instrumentLabel: instrumentLabel.trim(),
                bio: bio.trim()
            },
            imageUri
        );

        if (success) {
            Alert.alert('Éxito', 'El perfil se actualizó correctamente.');
            navigation.goBack();
            return;
        }

        Alert.alert('Error', 'No fue posible actualizar el perfil.');
    };

    const inputStyle = [
        styles.input,
        {
            backgroundColor: colors.cardColor,
            borderColor: colors.borderColor,
            color: colors.textColor
        }
    ];

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: colors.backgroundColor }
            ]}
        >
            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={{
                            uri: imageUri || 'https://via.placeholder.com/150'
                        }}
                        style={[
                            styles.avatar,
                            { borderColor: colors.primaryColor }
                        ]}
                    />
                    <View
                        style={[
                            styles.editIconBadge,
                            { backgroundColor: colors.buttonColor }
                        ]}
                    >
                        <Ionicons
                            name="camera"
                            size={20}
                            color={colors.buttonTextColor}
                        />
                    </View>
                </TouchableOpacity>
                <Text
                    style={[
                        styles.changePhotoText,
                        { color: colors.primaryColor }
                    ]}
                >
                    Cambiar foto
                </Text>
            </View>

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Nombre</Text>
            <TextInput
                style={inputStyle}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.secondaryTextColor}
            />

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Instrumento</Text>
            <TextInput
                style={inputStyle}
                value={instrumentLabel}
                onChangeText={setInstrumentLabel}
                placeholderTextColor={colors.secondaryTextColor}
            />

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Biografía</Text>
            <TextInput
                style={[inputStyle, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholderTextColor={colors.secondaryTextColor}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.buttonColor }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.buttonTextColor} />
                ) : (
                    <Text
                        style={[
                            styles.buttonText,
                            { color: colors.buttonTextColor }
                        ]}
                    >
                        Guardar cambios
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3
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
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top'
    },
    button: {
        padding: 15,
        borderRadius: 10,
        marginTop: 30,
        marginBottom: 50,
        alignItems: 'center'
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16
    }
});
