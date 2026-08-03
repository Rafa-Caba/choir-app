// src/screens/settings/themes/ThemeSelectionScreen.tsx

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ListRenderItemInfo,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import type { Theme } from '../../../types/theme';

const resolveThemeId = (
    themeId: string | Theme | null | undefined
): string | null => {
    if (!themeId) return null;
    return typeof themeId === 'string' ? themeId : themeId.id;
};

export const ThemeSelectionScreen = () => {
    const { publicThemes, fetchPublicThemes, loading } = useThemeStore();
    const user = useAuthStore((state) => state.user);
    const { currentTheme, setThemeById } = useTheme();
    const colors = currentTheme;
    const selectedThemeId = resolveThemeId(user?.themeId);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPublicThemes().catch(() => undefined);
    }, [fetchPublicThemes]);

    const handleSelectTheme = async (theme: Theme): Promise<void> => {
        setSaving(true);

        try {
            await setThemeById(theme.id);
            Alert.alert('Éxito', `Tema seleccionado: ${theme.name}`);
        } catch {
            Alert.alert('Error', 'No fue posible cambiar el tema.');
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<Theme>) => {
        const isSelected =
            selectedThemeId === item.id || currentTheme.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: item.cardColor,
                        borderColor: isSelected
                            ? colors.primaryColor
                            : 'transparent',
                        borderWidth: isSelected ? 3 : 0
                    }
                ]}
                onPress={() => handleSelectTheme(item)}
                activeOpacity={0.8}
                disabled={saving}
            >
                <View style={styles.previewHeader}>
                    <Text style={[styles.themeName, { color: item.textColor }]}>
                        {item.name}
                    </Text>
                    {isSelected && (
                        <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={colors.primaryColor}
                        />
                    )}
                </View>

                <View
                    style={[
                        styles.previewButton,
                        { backgroundColor: item.buttonColor }
                    ]}
                >
                    <Text
                        style={[
                            styles.previewButtonText,
                            { color: item.buttonTextColor }
                        ]}
                    >
                        Botón
                    </Text>
                </View>

                <View style={styles.colorRow}>
                    <View
                        style={[
                            styles.colorDot,
                            { backgroundColor: item.primaryColor }
                        ]}
                    />
                    <View
                        style={[
                            styles.colorDot,
                            { backgroundColor: item.accentColor }
                        ]}
                    />
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
        <View
            style={[
                styles.container,
                { backgroundColor: colors.backgroundColor }
            ]}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Elige tu estilo</Text>
                {saving && <ActivityIndicator color={colors.primaryColor} />}
            </View>

            <FlatList
                data={publicThemes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={fetchPublicThemes}
                contentContainerStyle={styles.listContent}
                numColumns={2}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    listContent: {
        padding: 10
    },
    card: {
        flex: 1,
        margin: 8,
        padding: 15,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2
        },
        minHeight: 120,
        justifyContent: 'space-between'
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    themeName: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    previewButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginTop: 8
    },
    previewButtonText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    colorRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 10
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10
    },
    borderedColorDot: {
        borderWidth: 1,
        borderColor: '#ccc'
    }
});
