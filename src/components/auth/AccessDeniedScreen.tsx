// src/components/auth/AccessDeniedScreen.tsx

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface AccessDeniedScreenProps {
    readonly title?: string;
    readonly message?: string;
    readonly showBackButton?: boolean;
}

export const AccessDeniedScreen = ({
    title = 'Acceso restringido',
    message = 'Tu cuenta no tiene permisos para abrir esta sección.',
    showBackButton = true
}: AccessDeniedScreenProps) => {
    const navigation = useNavigation();
    const colors = useTheme().currentTheme;

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <Ionicons name="shield-outline" size={64} color={colors.primaryColor} />
            <Text style={[styles.title, { color: colors.textColor }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.secondaryTextColor }]}>{message}</Text>
            {showBackButton && navigation.canGoBack() && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>Regresar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28
    },
    title: {
        marginTop: 18,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center'
    },
    message: {
        marginTop: 10,
        fontSize: 16,
        lineHeight: 23,
        textAlign: 'center'
    },
    button: {
        marginTop: 24,
        borderRadius: 12,
        paddingHorizontal: 22,
        paddingVertical: 12
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700'
    }
});
