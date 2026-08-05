// src/screens/settings/themes/ThemeSelectionScreen.tsx

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    type ListRenderItemInfo,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useThemesQuery } from '../../../hooks/query/useThemesData';
import type { Theme } from '../../../types/theme';

export const ThemeSelectionScreen = () => {
    const themesQuery = useThemesQuery();
    const { currentTheme, setThemeById } = useTheme();
    const colors = currentTheme;
    const themes = themesQuery.data ?? [];
    const [savingThemeId, setSavingThemeId] = useState<string | null>(null);

    const handleSelectTheme = async (theme: Theme): Promise<void> => {
        if (theme.id === currentTheme.id || savingThemeId) {
            return;
        }

        setSavingThemeId(theme.id);

        try {
            await setThemeById(theme.id);
        } catch {
            Alert.alert('Error', 'No fue posible cambiar el tema. Intenta nuevamente.');
        } finally {
            setSavingThemeId(null);
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<Theme>) => {
        const isSelected = currentTheme.id === item.id;
        const isSaving = savingThemeId === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: item.cardColor,
                        borderColor: isSelected ? colors.primaryColor : 'transparent',
                        borderWidth: isSelected ? 3 : 1,
                        opacity: savingThemeId && !isSaving ? 0.65 : 1
                    }
                ]}
                onPress={() => void handleSelectTheme(item)}
                activeOpacity={0.8}
                disabled={savingThemeId !== null}
            >
                <View style={styles.previewHeader}>
                    <Text style={[styles.themeName, { color: item.textColor }]}>{item.name}</Text>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={colors.primaryColor} />
                    ) : isSelected ? (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primaryColor} />
                    ) : null}
                </View>

                <View style={[styles.previewButton, { backgroundColor: item.buttonColor }]}>
                    <Text style={[styles.previewButtonText, { color: item.buttonTextColor }]}>Botón</Text>
                </View>

                <View style={styles.colorRow}>
                    <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
                    <View style={[styles.colorDot, { backgroundColor: item.accentColor }]} />
                    <View
                        style={[
                            styles.colorDot,
                            styles.borderedColorDot,
                            { backgroundColor: item.backgroundColor }
                        ]}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Elige tu estilo</Text>
                {themesQuery.isRefetching && (
                    <ActivityIndicator color={colors.primaryColor} />
                )}
            </View>

            <FlatList
                data={themes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={themesQuery.isRefetching}
                onRefresh={() => void themesQuery.refetch()}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                ListEmptyComponent={themesQuery.isLoading ? (
                    <ActivityIndicator color={colors.primaryColor} style={styles.status} />
                ) : themesQuery.isError ? (
                    <View style={styles.status}>
                        <Text style={[styles.statusText, { color: colors.secondaryTextColor }]}>
                            No fue posible cargar los temas.
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void themesQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.statusText, styles.status, { color: colors.secondaryTextColor }]}>
                        No hay temas disponibles.
                    </Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: { fontSize: 24, fontWeight: 'bold' },
    listContent: { padding: 10, flexGrow: 1 },
    card: {
        flex: 1,
        margin: 8,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        minHeight: 120,
        justifyContent: 'space-between'
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    themeName: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
    previewButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginTop: 8
    },
    previewButtonText: { fontSize: 10, fontWeight: 'bold' },
    colorRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
    colorDot: { width: 20, height: 20, borderRadius: 10 },
    borderedColorDot: { borderWidth: 1, borderColor: '#ccc' },
    status: { marginTop: 50, alignItems: 'center', justifyContent: 'center' },
    statusText: { textAlign: 'center' },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }
});
