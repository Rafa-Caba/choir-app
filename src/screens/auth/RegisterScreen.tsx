import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { useAppConfigStore } from '../../store/useAppConfigStore';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register, loading, errorMessage, clearError } = useAuthStore();
    const { appLogoUrl } = useAppConfigStore();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    // Form State (English keys)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (errorMessage) {
            Alert.alert('Error de Registro', errorMessage, [{ text: 'Ok', onPress: clearError }]);
        }
    }, [errorMessage, clearError]);

    const handleRegister = async () => {
        if (!name || !email || !username || !password || !confirmPassword) {
            Alert.alert("Campos vacíos", "Por favor completa todos los campos.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden.");
            return;
        }

        const success = await register({ name, email, username, password });

        if (success) {
            Alert.alert("Bienvenido", "Cuenta creada exitosamente.");
        }
    };

    const inputStyle = [
        styles.input, {
            backgroundColor: colors.cardColor,
            color: colors.textColor,
            borderColor: colors.borderColor || '#ccc'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Image
                            source={appLogoUrl ? { uri: appLogoUrl } : require('../../../assets/icon.png')}
                            resizeMode="contain"
                            style={styles.logo}
                            borderRadius={35}
                        />
                    </View>

                    <Text style={[styles.title, { color: colors.textColor }]}>
                        Crear Cuenta
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
                        Únete a nuestra comunidad
                    </Text>

                    <View style={styles.form}>
                        <TextInput
                            style={inputStyle}
                            placeholder="Nombre Completo"
                            placeholderTextColor={colors.secondaryTextColor}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={inputStyle}
                            placeholder="Email"
                            placeholderTextColor={colors.secondaryTextColor}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TextInput
                            style={inputStyle}
                            placeholder="Usuario"
                            placeholderTextColor={colors.secondaryTextColor}
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                        />

                        <TextInput
                            style={inputStyle}
                            placeholder="Contraseña"
                            placeholderTextColor={colors.secondaryTextColor}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TextInput
                            style={inputStyle}
                            placeholder="Confirmar Contraseña"
                            placeholderTextColor={colors.secondaryTextColor}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity
                            style={[styles.btnRegister, { backgroundColor: colors.buttonColor }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.buttonTextColor} />
                            ) : (
                                <Text style={[styles.btnText, { color: colors.buttonTextColor }]}>Registrarse</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                        <Text style={{ color: colors.secondaryTextColor }}>¿Ya tienes cuenta? </Text>
                        <Text style={{ color: colors.primaryColor, fontWeight: 'bold' }}>Inicia Sesión</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
    form: { gap: 15 },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
        borderRadius: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    btnRegister: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowColor: '#000',
    },
    btnText: { fontSize: 18, fontWeight: 'bold' },
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 }
});