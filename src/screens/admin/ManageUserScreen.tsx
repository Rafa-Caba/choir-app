import React, { useState, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
    Image, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '../../types/auth';

export const ManageUserScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { saveUserAction, loading } = useAdminUsersStore();

    const editingUser: User | undefined = route.params?.user;
    const isEdit = !!editingUser;

    // Form State
    const [name, setName] = useState(editingUser?.name || '');
    const [username, setUsername] = useState(editingUser?.username || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [password, setPassword] = useState('');

    // Explicitly typed state for roles
    const [role, setRole] = useState<'VIEWER' | 'EDITOR' | 'ADMIN'>(
        (editingUser?.role as 'VIEWER' | 'EDITOR' | 'ADMIN') || 'VIEWER'
    );

    const [instrument, setInstrument] = useState(editingUser?.instrument || '');
    const [bio, setBio] = useState(editingUser?.bio || '');
    const [voice, setVoice] = useState(editingUser?.voice || false);

    const [imageUri, setImageUri] = useState<string | null>(editingUser?.imageUrl || null);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEdit ? 'Editar Usuario' : 'Nuevo Usuario',
            headerStyle: { backgroundColor: colors.backgroundColor },
            headerTintColor: colors.textColor
        });
    }, [navigation, isEdit, colors]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            aspect: [1, 1],
            allowsEditing: true
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        if (!name.trim() || !username.trim() || !email.trim()) {
            Alert.alert("Error", "Nombre, Usuario y Email son obligatorios.");
            return;
        }

        if (!isEdit && !password) {
            Alert.alert("Error", "Contraseña requerida para nuevos usuarios.");
            return;
        }

        const payload = {
            name,
            username,
            email,
            password,
            role,
            instrument,
            bio,
            voice
        };

        const success = await saveUserAction(payload, imageUri || undefined, editingUser?.id);

        if (success) {
            Alert.alert("Éxito", isEdit ? "Usuario actualizado correctamente." : "Usuario creado correctamente.");
            navigation.goBack();
        } else {
            Alert.alert("Error", "No se pudo guardar los cambios.");
        }
    };

    // Helper for Styles
    const inputStyle = [
        styles.input,
        {
            backgroundColor: colors.cardColor,
            color: colors.textColor,
            borderColor: colors.borderColor || '#ddd'
        }
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <ScrollView contentContainerStyle={styles.container}>

                {/* Avatar Picker */}
                <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={[styles.avatar, { borderColor: colors.primaryColor }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                            <Ionicons name="person" size={50} color={colors.secondaryTextColor} />
                        </View>
                    )}
                    <View style={[styles.cameraIcon, { backgroundColor: colors.primaryColor }]}>
                        <Ionicons name="camera" size={16} color="white" />
                    </View>
                </TouchableOpacity>

                {/* Fields */}
                <Text style={[styles.label, { color: colors.textColor }]}>Nombre</Text>
                <TextInput style={inputStyle} placeholderTextColor={colors.secondaryTextColor} placeholder="Nombre Completo" value={name} onChangeText={setName} />

                <Text style={[styles.label, { color: colors.textColor }]}>Usuario</Text>
                <TextInput style={inputStyle} placeholderTextColor={colors.secondaryTextColor} placeholder="username" value={username} onChangeText={setUsername} autoCapitalize="none" />

                <Text style={[styles.label, { color: colors.textColor }]}>Email</Text>
                <TextInput style={inputStyle} placeholderTextColor={colors.secondaryTextColor} placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                <Text style={[styles.label, { color: colors.textColor }]}>Contraseña</Text>
                <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.secondaryTextColor}
                    placeholder={isEdit ? "Dejar en blanco para mantener" : "Contraseña"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Role Selector */}
                <Text style={[styles.label, { color: colors.textColor }]}>Rol</Text>
                <View style={styles.roleRow}>
                    {/* 🛠️ FIX: Use 'as const' to ensure TS knows these strings match the Role type */}
                    {(['VIEWER', 'EDITOR', 'ADMIN'] as const).map((r) => (
                        <TouchableOpacity
                            key={r}
                            onPress={() => setRole(r)}
                            style={[
                                styles.roleBtn,
                                { borderColor: colors.borderColor },
                                role === r && { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }
                            ]}
                        >
                            <Text style={{
                                color: role === r ? colors.buttonTextColor : colors.secondaryTextColor,
                                fontWeight: 'bold', fontSize: 12
                            }}>
                                {r}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Instrument */}
                <Text style={[styles.label, { color: colors.textColor }]}>Instrumento</Text>
                <TextInput style={inputStyle} placeholderTextColor={colors.secondaryTextColor} placeholder="Ej. Guitarra, Voz" value={instrument} onChangeText={setInstrument} />

                {/* Bio */}
                <Text style={[styles.label, { color: colors.textColor }]}>Biografía</Text>
                <TextInput
                    style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
                    placeholderTextColor={colors.secondaryTextColor}
                    placeholder="Breve descripción del miembro..."
                    value={bio}
                    onChangeText={setBio}
                    multiline
                />

                {/* Voice Switch */}
                <View style={[styles.switchRow, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                    <Text style={[styles.switchLabel, { color: colors.textColor }]}>¿Tiene Voz? (Cantante)</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: colors.primaryColor }}
                        thumbColor={voice ? colors.buttonTextColor : "#f4f3f4"}
                        onValueChange={setVoice}
                        value={voice}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>
                            {isEdit ? "Actualizar Usuario" : "Crear Usuario"}
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    avatarContainer: { alignSelf: 'center', marginBottom: 20 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', elevation: 4
    },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
    roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20, padding: 15, borderRadius: 10, borderWidth: 1
    },
    switchLabel: { fontSize: 16, fontWeight: '600' },
    saveBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, elevation: 2 },
    saveText: { fontWeight: 'bold', fontSize: 16 },
});