import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, Image, TextInput, Text, TouchableOpacity,
    Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Config from 'react-native-config';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingScreen } from '../LoadingScreen';
import { useAppConfigStore } from '../../store/useAppConfigStore';
import { useTheme } from '../../context/ThemeContext';
import ENV from '../../config/env';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();

    const { login, errorMessage, clearError, loading } = useAuthStore();
    const { appTitle, appLogoUrl } = useAppConfigStore();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    // State (English)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (errorMessage) {
            Alert.alert('Login Incorrecto', errorMessage, [{
                text: 'Ok',
                onPress: clearError
            }]);
        }
    }, [errorMessage, clearError]);

    const onLogin = async () => {
        Keyboard.dismiss();
        if (!username || !password) {
            Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }

        // The store handles the API call and Token storage
        await login({ username, password });
        // Navigation is usually handled automatically by the AppNavigator observing 'user' state
    };

    if (loading) return <LoadingScreen />;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                    <Image
                        source={appLogoUrl ? { uri: appLogoUrl } : require('../../../assets/icon.png')}
                        resizeMode="contain"
                        style={styles.logo}
                        borderRadius={35}
                    />
                </View>

                <Text style={[styles.title, { color: colors.textColor }]}>
                    {appTitle || 'Ero Cras'}
                </Text>

                <KeyboardAvoidingView
                    behavior={(Platform.OS === 'ios') ? 'padding' : undefined}
                >
                    <View style={{ marginHorizontal: 15 }}>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.cardColor,
                                color: colors.textColor,
                                borderColor: colors.borderColor || '#ccc'
                            }]}
                            placeholder="Correo o Usuario"
                            value={username}
                            placeholderTextColor={colors.secondaryTextColor}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setUsername}
                        />
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.cardColor,
                                color: colors.textColor,
                                borderColor: colors.borderColor || '#ccc'
                            }]}
                            placeholder="Contraseña"
                            value={password}
                            placeholderTextColor={colors.secondaryTextColor}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.btnLogin, { backgroundColor: colors.buttonColor }]}
                                activeOpacity={0.6}
                                onPress={onLogin}
                            >
                                <Text style={[styles.btnLoginText, { color: colors.buttonTextColor }]}>
                                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register')}
                                style={styles.loginLink}
                            >
                                <Text style={{ color: colors.secondaryTextColor }}>¿No tienes cuenta? </Text>
                                <Text style={{ color: colors.primaryColor, fontWeight: 'bold' }}>Regístrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 30,
    },
    logo: {
        width: 130,
        height: 130,
        marginBottom: 30,
        borderRadius: 20
    },
    title: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 25,
        fontWeight: '600'
    },
    input: {
        fontSize: 16,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 15,
        borderRadius: 12,
        borderWidth: 1,
        width: '100%',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20
    },
    btnLogin: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    btnLoginText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 }
});