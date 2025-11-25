import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, 
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAppConfigStore } from '../../store/useAppConfigStore';

export const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register, loading, errorMessage, clearError } = useAuthStore();
    const { appLogoUrl } = useAppConfigStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    // Form State
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
        
        if (success) navigation.navigate('HomeScreen');

    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Back Button */}
                    {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={30} color={colors.text} />
                    </TouchableOpacity> */}
                    <View style={{ alignItems: 'center' }}>
                        <Image 
                            source={appLogoUrl ? { uri: appLogoUrl } : require('../../assets/EroCras4.jpg')}
                            resizeMode="contain"
                            style={styles.logo} 
                            borderRadius={35}
                        />
                    </View>

                    <Text style={[styles.title, { color: colors.text, fontFamily: 'MyCustomFont' }]}>
                        Crear Cuenta
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Únete a nuestra comunidad
                    </Text>

                    <View style={styles.form}>
                        <TextInput
                            style={[
                                styles.input, { 
                                    backgroundColor: colors.card, 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }
                            ]}
                            placeholder="Nombre Completo"
                            placeholderTextColor={colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />
                        
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Email"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Usuario"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Contraseña"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            placeholder="Confirmar Contraseña"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity 
                            style={[styles.btnRegister, { backgroundColor: colors.button }]} 
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.buttonText} />
                            ) : (
                                <Text style={[styles.btnText, { color: colors.buttonText }]}>Registrarse</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                        <Text style={{ color: colors.textSecondary }}>¿Ya tienes cuenta? </Text>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Inicia Sesión</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
    form: { gap: 15, marginHorizontal: 15 },
    logo: {
        width: 130,
        height: 130,
        marginBottom: 50,
        borderRadius: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    btnRegister: {
        width: 200,
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginHorizontal: 'auto',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowColor: '#000', 
    },
    btnText: { fontSize: 18, fontWeight: 'bold' },
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 }
});