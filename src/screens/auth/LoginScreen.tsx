import React, { useEffect, useState } from 'react';
import { 
    View, StyleSheet, Image, TextInput, Text, TouchableOpacity, 
    Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { LoadingScreen } from '../LoadingScreen';
import { useAppConfigStore } from '../../store/useAppConfigStore';
import { useTheme } from '../../context/ThemeContext';

export const LoginScreen = () => {
    const navigation = useNavigation<any>();
    
    const { login, errorMessage, clearError, loading } = useAuthStore();
    const { appTitle, appLogoUrl } = useAppConfigStore();

    const { currentTheme } = useTheme(); 
    const colors = currentTheme.colors;

    const [email, setEmail] = useState('');
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
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
            return;
        }
        
        const success = await login({ username: email, password });

        if (success) navigation.navigate('HomeScreen');
    };

    if (loading) return <LoadingScreen />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center' }}>
                    <Image 
                        source={appLogoUrl ? { uri: appLogoUrl } : require('../../assets/EroCras4.jpg')}
                        resizeMode="contain"
                        style={styles.logo} 
                        borderRadius={35}
                    />
                </View>

                <Text style={[styles.title, { color: colors.text, fontFamily: 'MyCustomFont' }]}>{appTitle}</Text>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={(Platform.OS === 'ios') ? 'padding' : 'height'}
                >
                    <View style={{ marginHorizontal: 15 }}>
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.card, 
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="Correo o Usuario"
                            value={email}
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            onChangeText={setEmail}
                        />
                        <TextInput
                            style={[styles.input, { 
                                backgroundColor: colors.card, 
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="Contraseña"
                            value={password}
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={[styles.btnLogin, { backgroundColor: colors.button }]}
                                activeOpacity={0.6}
                                onPress={onLogin}
                            >
                                <Text style={[styles.btnLoginText, { color: colors.buttonText }]}>
                                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                                </Text>
                            </TouchableOpacity>
                        
                            {/* <TouchableOpacity 
                                onPress={() => navigation.navigate('RegisterScreen')} 
                                style={styles.loginLink}
                                disabled
                            >
                                <Text style={{ color: colors.textSecondary }}>¿No tienes cuenta? </Text>
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Regístrate</Text>
                            </TouchableOpacity> */}
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
    },
    logo: {
        width: 130,
        height: 130,
        marginBottom: 50,
        borderRadius: 20
    },
    title: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 25,
        fontWeight: '600'
    },
    input: {
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
        marginTop: 20
    },
    btnLogin: {
        width: 200,
        paddingVertical: 12,
        borderRadius: 15,
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
    loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 }
});