import React, { useEffect, useState } from 'react';
import { 
    View, StyleSheet, Image, TextInput, Text, TouchableOpacity, 
    Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingScreen } from './LoadingScreen';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    
    // 1. Use the Zustand Store
    const { login, errorMessage, clearError, loading } = useAuthStore();

    // 2. Local State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // 3. Handle Errors
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
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }
        
        // Backend expects 'username' key, even if user enters email
        await login({ username: email, password });
    };

    if (loading) return <LoadingScreen />;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center' }}>
                    <Image 
                        // Use a local asset or a generic placeholder
                        source={require('../assets/EroCras4.jpg')} 
                        resizeMode="contain"
                        style={styles.logo} 
                        borderRadius={30}
                    />
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={(Platform.OS === 'ios') ? 'padding' : 'height'}
                >
                    <View style={{ marginHorizontal: 15 }}>
                        <TextInput
                            placeholder="Correo o Usuario"
                            value={email}
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setEmail}
                        />
                        <TextInput
                            placeholder="Contraseña"
                            value={password}
                            style={styles.input}
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={styles.btnLogin} 
                                activeOpacity={0.6}
                                onPress={onLogin}
                            >
                                <Text style={styles.btnLoginText}>Iniciar Sesión</Text>
                            </TouchableOpacity>
                        
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('RegistroScreen')}
                                style={{ ...styles.btnLogin, width: 140, height: 40, marginTop: 10, backgroundColor: '#b388ff' }}
                            >
                                <Text style={{ ...styles.btnLoginText, fontWeight: '400', fontSize: 16 }}>Registrarse</Text>
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
        paddingTop: 70,
        paddingHorizontal: 30,
        // marginHorizontal: 10,
        backgroundColor: '#f2f2f2' // Light background
    },
    logo: {
        width: 130,
        height: 130,
        marginBottom: 50,
    },
    input: {
        color: '#000',
        backgroundColor: '#d1b3ff',
        fontSize: 18,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 15,
        marginHorizontal: 5,
        borderRadius: 10,
        width: '100%',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20,
        gap: 10
    },
    btnLogin: {
        backgroundColor: '#8B4BFF',
        width: 200,
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    btnLoginText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
});