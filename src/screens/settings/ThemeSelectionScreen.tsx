import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ThemeSelectionScreen = () => {
    const { availableThemes, currentTheme, setThemeById, loading } = useTheme();
    const colors = currentTheme.colors;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>Cargando temas...</Text>
            </View>
        );
    }

    if (!availableThemes || availableThemes.length === 0) {
        return (
             <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={50} color={colors.textSecondary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>No se encontraron temas.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Elige tu estilo</Text>
            
            <View style={styles.grid}>
                {availableThemes?.map(theme => (
                    <TouchableOpacity 
                        key={theme.id}
                        style={[
                            styles.card, 
                            { backgroundColor: theme.cardColor, borderColor: theme.primaryColor },
                            currentTheme.id === theme.id && styles.activeCard
                        ]}
                        onPress={() => setThemeById(theme.id)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.previewCircle, { backgroundColor: theme.primaryColor }]} />
                        <View style={{flex:1}}>
                            <Text style={[styles.themeName, { color: theme.textColor }]}>{theme.name}</Text>
                            <Text style={{ color: theme.textColor, opacity: 0.7, fontSize: 12 }}>
                                {theme.isDark ? 'Oscuro' : 'Claro'}
                            </Text>
                        </View>
                        {currentTheme.id === theme.id && (
                            <Ionicons name="checkmark-circle" size={24} color={theme.accentColor} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    grid: { flexDirection: 'column', gap: 15 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    activeCard: { borderWidth: 3 },
    previewCircle: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
    themeName: { fontSize: 18, fontWeight: 'bold' }
});