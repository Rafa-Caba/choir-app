// src/screens/auth/ChangePasswordScreen.tsx

import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingScreen } from '../LoadingScreen';

export const ChangePasswordScreen = () => {
    const colors = useTheme().currentTheme;
    const completePasswordChange = useAuthStore((state) => state.completePasswordChange);
    const logout = useAuthStore((state) => state.logout);
    const loading = useAuthStore((state) => state.loading);
    const errorMessage = useAuthStore((state) => state.errorMessage);
    const clearError = useAuthStore((state) => state.clearError);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');

    useEffect(() => {
        if (errorMessage) {
            Alert.alert('No fue posible cambiarla', errorMessage, [
                { text: 'Aceptar', onPress: clearError }
            ]);
        }
    }, [clearError, errorMessage]);

    const submit = async (): Promise<void> => {
        if (!currentPassword || !newPassword || !confirmation) {
            Alert.alert('Datos incompletos', 'Completa todos los campos.');
            return;
        }

        if (newPassword !== confirmation) {
            Alert.alert('Contraseñas diferentes', 'La confirmación no coincide con la nueva contraseña.');
            return;
        }

        if (newPassword.length < 12) {
            Alert.alert('Contraseña insegura', 'La nueva contraseña debe tener al menos 12 caracteres.');
            return;
        }

        await completePasswordChange({ currentPassword, newPassword });
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}> 
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Text style={[styles.title, { color: colors.textColor }]}>Cambia tu contraseña</Text>
                <Text style={[styles.description, { color: colors.secondaryTextColor }]}>Tu administrador creó una contraseña temporal. Debes reemplazarla antes de usar la aplicación.</Text>
                {[{
                    value: currentPassword,
                    setter: setCurrentPassword,
                    placeholder: 'Contraseña temporal'
                }, {
                    value: newPassword,
                    setter: setNewPassword,
                    placeholder: 'Nueva contraseña'
                }, {
                    value: confirmation,
                    setter: setConfirmation,
                    placeholder: 'Confirma la nueva contraseña'
                }].map((field) => (
                    <TextInput
                        key={field.placeholder}
                        style={[styles.input, {
                            backgroundColor: colors.cardColor,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }]}
                        value={field.value}
                        onChangeText={field.setter}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.secondaryTextColor}
                        secureTextEntry
                    />
                ))}
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={submit}>
                    <Text style={[styles.primaryText, { color: colors.buttonTextColor }]}>Guardar nueva contraseña</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={{ color: colors.secondaryTextColor }}>Cerrar sesión</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 22, marginBottom: 28 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 14 },
    primaryButton: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    primaryText: { fontSize: 16, fontWeight: '700' },
    logoutButton: { alignItems: 'center', paddingVertical: 20 }
});
