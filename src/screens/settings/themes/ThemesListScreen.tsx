// src/screens/settings/themes/ThemesListScreen.tsx

import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import {
    useDeleteThemeMutation,
    useThemesQuery
} from '../../../hooks/query/useThemesData';
import type { SettingsStackParamList } from '../../../navigation/SettingsNavigator';
import type { Theme } from '../../../types/theme';

export const ThemesListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'ThemesListScreen'>>();
    const colors = useTheme().currentTheme;
    const themesQuery = useThemesQuery();
    const deleteMutation = useDeleteThemeMutation();
    const themes = themesQuery.data ?? [];

    const handleDelete = (theme: Theme): void => {
        Alert.alert('Eliminar tema', `¿Deseas eliminar “${theme.name}”?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                    deleteMutation.mutate(theme.id, {
                        onError: () => Alert.alert('Error', 'No fue posible eliminar el tema.')
                    });
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Temas</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageThemeScreen')}
                >
                    <Ionicons name="add" size={24} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={themes}
                keyExtractor={(item) => item.id}
                refreshing={themesQuery.isRefetching}
                onRefresh={() => void themesQuery.refetch()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.cardColor }]}>
                        <View style={styles.previewContainer}>
                            <View style={[styles.colorPreview, { backgroundColor: item.primaryColor }]} />
                            <View style={[styles.colorPreview, { backgroundColor: item.backgroundColor }]} />
                            <View style={[styles.colorPreview, { backgroundColor: item.accentColor }]} />
                        </View>
                        <View style={styles.info}>
                            <Text style={[styles.name, { color: colors.textColor }]}>{item.name}</Text>
                            <Text style={[styles.type, { color: colors.secondaryTextColor }]}>
                                {item.isDark ? 'Modo oscuro' : 'Modo claro'}
                            </Text>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ManageThemeScreen', { themeToEdit: item })}
                                style={styles.actionButton}
                            >
                                <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDelete(item)}
                                style={styles.actionButton}
                                disabled={deleteMutation.isPending}
                            >
                                <Ionicons name="trash-outline" size={20} color="#E91E63" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={themesQuery.isLoading ? (
                    <ActivityIndicator color={colors.primaryColor} style={styles.status} />
                ) : themesQuery.isError ? (
                    <View style={styles.status}>
                        <Text style={{ color: colors.secondaryTextColor }}>No fue posible cargar los temas.</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void themesQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.statusText, { color: colors.secondaryTextColor }]}>No hay temas creados.</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    addButton: { padding: 10, borderRadius: 25, elevation: 3 },
    listContent: { paddingBottom: 20, flexGrow: 1 },
    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 10, padding: 15, elevation: 2 },
    previewContainer: { flexDirection: 'row', gap: 5, marginRight: 15 },
    colorPreview: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    type: { fontSize: 12 },
    actions: { flexDirection: 'row' },
    actionButton: { padding: 8 },
    status: { marginTop: 50, alignItems: 'center' },
    statusText: { marginTop: 50, textAlign: 'center' },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }
});
