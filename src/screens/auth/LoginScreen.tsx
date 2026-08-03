// src/screens/auth/LoginScreen.tsx

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingScreen } from '../LoadingScreen';

export const LoginScreen = () => {
    const login = useAuthStore((state) => state.login);
    const loginAsPlatform = useAuthStore((state) => state.loginAsPlatform);
    const errorMessage = useAuthStore((state) => state.errorMessage);
    const clearError = useAuthStore((state) => state.clearError);
    const loading = useAuthStore((state) => state.loading);
    const lastChoirCode = useAuthStore((state) => state.lastChoirCode);
    const colors = useTheme().currentTheme;
    const [choirCode, setChoirCode] = useState(lastChoirCode);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [platformMode, setPlatformMode] = useState(false);

    useEffect(() => {
        if (lastChoirCode && choirCode.length === 0) {
            setChoirCode(lastChoirCode);
        }
    }, [choirCode.length, lastChoirCode]);

    useEffect(() => {
        if (errorMessage) {
            Alert.alert('No fue posible iniciar sesión', errorMessage, [
                { text: 'Aceptar', onPress: clearError }
            ]);
        }
    }, [clearError, errorMessage]);

    const onLogin = async (): Promise<void> => {
        Keyboard.dismiss();

        if (!identifier.trim() || !password) {
            Alert.alert('Datos incompletos', 'Ingresa tu usuario o correo y contraseña.');
            return;
        }

        if (!platformMode && !choirCode.trim()) {
            Alert.alert('Código requerido', 'Ingresa el código de tu coro.');
            return;
        }

        if (platformMode) {
            await loginAsPlatform({ identifier, password });
            return;
        }

        await login({ choirCode, identifier, password });
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Image
                    source={require('../../../assets/icon.png')}
                    resizeMode="contain"
                    style={styles.logo}
                />
                <Text style={[styles.title, { color: colors.textColor }]}>Choir App</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>Acceso privado para miembros del coro</Text>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    {!platformMode && (
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.cardColor,
                                color: colors.textColor,
                                borderColor: colors.borderColor
                            }]}
                            placeholder="Código del coro"
                            placeholderTextColor={colors.secondaryTextColor}
                            value={choirCode}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setChoirCode}
                        />
                    )}
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.cardColor,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }]}
                        placeholder="Correo o usuario"
                        placeholderTextColor={colors.secondaryTextColor}
                        value={identifier}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={setIdentifier}
                    />
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.cardColor,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }]}
                        placeholder="Contraseña"
                        placeholderTextColor={colors.secondaryTextColor}
                        value={password}
                        secureTextEntry
                        onChangeText={setPassword}
                        onSubmitEditing={onLogin}
                    />

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]}
                        onPress={onLogin}
                    >
                        <Text style={[styles.primaryButtonText, { color: colors.buttonTextColor }]}>Iniciar sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.platformButton}
                        onPress={() => setPlatformMode((current) => !current)}
                    >
                        <Text style={{ color: colors.primaryColor }}>
                            {platformMode ? 'Usar acceso de un coro' : 'Acceso de plataforma'}
                        </Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 30 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    logo: { width: 130, height: 130, alignSelf: 'center', marginBottom: 24, borderRadius: 24 },
    title: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
    subtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 28 },
    input: { fontSize: 16, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 14, borderRadius: 12, borderWidth: 1 },
    primaryButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    primaryButtonText: { fontSize: 17, fontWeight: '700' },
    platformButton: { alignItems: 'center', paddingVertical: 18 }
});
