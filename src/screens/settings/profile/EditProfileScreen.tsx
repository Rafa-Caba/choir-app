import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';

export const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { user, updateUserProfile, loading } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    // Initialize with English keys
    const [name, setName] = useState(user?.name || '');
    const [instrument, setInstrument] = useState(user?.instrument || '');
    const [bio, setBio] = useState(user?.bio || '');

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
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Could not update profile');
        }
    };

    const inputStyle = [
        styles.input,
        {
            backgroundColor: colors.cardColor,
            borderColor: colors.borderColor,
            color: colors.textColor,
        }
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>

            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={{ uri: imageUri || 'https://via.placeholder.com/150' }}
                        style={[styles.avatar, { borderColor: colors.primaryColor }]}
                    />
                    <View style={[styles.editIconBadge, { backgroundColor: colors.buttonColor }]}>
                        <Ionicons name="camera" size={20} color={colors.buttonTextColor} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.changePhotoText, { color: colors.primaryColor }]}>Change Photo</Text>
            </View>

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Name</Text>
            <TextInput
                style={inputStyle}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.secondaryTextColor}
            />

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Instrument</Text>
            <TextInput
                style={inputStyle}
                value={instrument}
                onChangeText={setInstrument}
                placeholderTextColor={colors.secondaryTextColor}
            />

            <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Bio</Text>
            <TextInput
                style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholderTextColor={colors.secondaryTextColor}
            />

            <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.buttonColor }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.buttonTextColor} />
                ) : (
                    <Text style={[styles.btnText, { color: colors.buttonTextColor }]}>Save Changes</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
    editIconBadge: {
        position: 'absolute', bottom: 0, right: 0,
        padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white'
    },
    changePhotoText: { marginTop: 10, fontWeight: '600' },
    label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 5 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    btn: { padding: 15, borderRadius: 10, marginTop: 30, marginBottom: 50, alignItems: 'center' },
    btnText: { fontWeight: 'bold', fontSize: 16 }
});