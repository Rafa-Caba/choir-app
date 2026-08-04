// src/screens/platform/PlatformProfileScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile } from '../../services/auth';
import { useAdminChoirsStore } from '../../store/useAdminChoirsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';

const MINIMUM_PASSWORD_LENGTH = 12;

export const PlatformProfileScreen = () => {
    const colors = useTheme().currentTheme;
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    const replaceUser = useAuthStore((state) => state.replaceUser);
    const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
    const completePasswordChange = useAuthStore((state) => state.completePasswordChange);
    const choirs = useAdminChoirsStore((state) => state.choirs);
    const fetchChoirs = useAdminChoirsStore((state) => state.fetchChoirs);
    const selectChoir = useTargetChoirStore((state) => state.selectChoir);
    const clearSelection = useTargetChoirStore((state) => state.clearSelection);

    const [name, setName] = useState(user?.name ?? '');
    const [username, setUsername] = useState(user?.username ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [bio, setBio] = useState(user?.bio ?? '');
    const [preferredChoirId, setPreferredChoirId] = useState(
        user?.preferredChoirId ?? ''
    );
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    useEffect(() => {
        setName(user?.name ?? '');
        setUsername(user?.username ?? '');
        setEmail(user?.email ?? '');
        setBio(user?.bio ?? '');
        setPreferredChoirId(user?.preferredChoirId ?? '');
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            if (user?.role !== 'SUPER_ADMIN') {
                return undefined;
            }

            fetchChoirs(true).catch(() => undefined);
            getUserProfile()
                .then(replaceUser)
                .catch(() => undefined);
            return undefined;
        }, [fetchChoirs, replaceUser, user?.role])
    );

    if (user?.role !== 'SUPER_ADMIN') {
        return <AccessDeniedScreen />;
    }

    const saveProfile = async (): Promise<void> => {
        const normalizedName = name.trim();
        const normalizedUsername = username.trim().toLowerCase();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedUsername || !normalizedEmail) {
            Alert.alert(
                'Datos incompletos',
                'Nombre, usuario y correo son obligatorios.'
            );
            return;
        }

        const success = await updateUserProfile({
            name: normalizedName,
            username: normalizedUsername,
            email: normalizedEmail,
            bio: bio.trim(),
            preferredChoirId: preferredChoirId || null
        });

        if (!success) {
            Alert.alert(
                'No fue posible guardar',
                'Revisa los datos e intenta nuevamente.'
            );
            return;
        }

        const preferredChoir = choirs.find(
            (choir) => choir.id === preferredChoirId && choir.isActive
        );

        if (preferredChoir) {
            selectChoir(preferredChoir);
        } else {
            clearSelection();
        }

        Alert.alert(
            'Perfil actualizado',
            'Tus datos y preferencias se guardaron correctamente.'
        );
    };

    const savePassword = async (): Promise<void> => {
        if (!currentPassword || !newPassword || !passwordConfirmation) {
            Alert.alert(
                'Datos incompletos',
                'Completa los tres campos de contraseña.'
            );
            return;
        }

        if (newPassword !== passwordConfirmation) {
            Alert.alert(
                'Contraseñas diferentes',
                'La confirmación no coincide.'
            );
            return;
        }

        if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
            Alert.alert(
                'Contraseña insegura',
                `La nueva contraseña debe tener al menos ${MINIMUM_PASSWORD_LENGTH} caracteres.`
            );
            return;
        }

        const success = await completePasswordChange({
            currentPassword,
            newPassword
        });

        if (!success) {
            Alert.alert(
                'No fue posible cambiarla',
                'Verifica tu contraseña actual y vuelve a intentar.'
            );
            return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setPasswordConfirmation('');
        Alert.alert(
            'Contraseña actualizada',
            'La contraseña se cambió y las sesiones anteriores fueron revocadas.'
        );
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
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.sectionTitle, { color: colors.textColor }]}>Perfil de plataforma</Text>
                <Text style={[styles.description, { color: colors.secondaryTextColor }]}> 
                    Tu cuenta continúa siendo global. El coro predeterminado solo selecciona el contexto inicial de la consola y no cambia tus permisos.
                </Text>

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Nombre</Text>
                <TextInput style={inputStyle} value={name} onChangeText={setName} />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Usuario</Text>
                <TextInput
                    style={inputStyle}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Correo</Text>
                <TextInput
                    style={inputStyle}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Biografía</Text>
                <TextInput
                    style={[inputStyle, styles.bioInput]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    textAlignVertical="top"
                />

                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Coro predeterminado</Text>
                <View
                    style={[
                        styles.pickerContainer,
                        {
                            backgroundColor: colors.cardColor,
                            borderColor: colors.borderColor
                        }
                    ]}
                >
                    <Picker
                        selectedValue={preferredChoirId}
                        onValueChange={(value: string) => setPreferredChoirId(value)}
                        style={{ color: colors.textColor }}
                        dropdownIconColor={colors.primaryColor}
                    >
                        <Picker.Item label="Ninguno" value="" />
                        {choirs
                            .filter((choir) => choir.isActive)
                            .map((choir) => (
                                <Picker.Item
                                    key={choir.id}
                                    label={`${choir.name} (${choir.code})`}
                                    value={choir.id}
                                />
                            ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]}
                    onPress={saveProfile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.primaryText, { color: colors.buttonTextColor }]}>Guardar perfil</Text>
                    )}
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

                <Text style={[styles.sectionTitle, { color: colors.textColor }]}>Cambiar contraseña</Text>
                <TextInput
                    style={inputStyle}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Contraseña actual"
                    placeholderTextColor={colors.secondaryTextColor}
                    secureTextEntry
                />
                <TextInput
                    style={inputStyle}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={colors.secondaryTextColor}
                    secureTextEntry
                />
                <TextInput
                    style={inputStyle}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    placeholder="Confirmar nueva contraseña"
                    placeholderTextColor={colors.secondaryTextColor}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.primaryColor }]}
                    onPress={savePassword}
                    disabled={loading}
                >
                    <Text style={[styles.secondaryText, { color: colors.primaryColor }]}>Actualizar contraseña</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 48 },
    sectionTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
    description: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 16,
        marginBottom: 4
    },
    bioInput: { minHeight: 92 },
    pickerContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 22
    },
    primaryText: { fontSize: 16, fontWeight: '800' },
    divider: { height: 1, marginVertical: 30 },
    secondaryButton: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10
    },
    secondaryText: { fontSize: 16, fontWeight: '800' }
});
