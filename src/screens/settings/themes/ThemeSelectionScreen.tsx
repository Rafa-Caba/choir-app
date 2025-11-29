import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTheme } from '../../../context/ThemeContext';
import { updateTheme as updateUserThemeService } from '../../../services/auth'; // Use the service directly or add action to store

export const ThemeSelectionScreen = () => {
    const { publicThemes, fetchPublicThemes, loading } = useThemeStore();
    const { user, checkAuth } = useAuthStore();
    const { currentTheme, setThemeById } = useTheme();
    const colors = currentTheme;

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPublicThemes();
    }, []);

    const handleSelectTheme = async (theme: any) => {
        setSaving(true);
        try {
            // This now handles both UI update AND Backend persistence
            await setThemeById(theme.id);
            Alert.alert("Success", `Theme changed to: ${theme.name}`);
        } catch (e) {
            Alert.alert("Error", "Could not change theme");
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isSelected = user?.themeId === item.id || user?.themeId?._id === item.id || currentTheme.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: item.cardColor, // Use the theme's own colors for preview!
                        borderColor: isSelected ? colors.primaryColor : 'transparent',
                        borderWidth: isSelected ? 3 : 0
                    }
                ]}
                onPress={() => handleSelectTheme(item)}
                activeOpacity={0.8}
            >
                <View style={styles.previewHeader}>
                    <Text style={[styles.themeName, { color: item.textColor }]}>{item.name}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primaryColor} />}
                </View>

                {/* Mini UI Preview */}
                <View style={[styles.miniBtn, { backgroundColor: item.buttonColor }]}>
                    <Text style={{ color: item.buttonTextColor, fontSize: 10, fontWeight: 'bold' }}>Botón</Text>
                </View>

                <View style={[styles.colorRow, { marginTop: 10 }]}>
                    <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
                    <View style={[styles.colorDot, { backgroundColor: item.accentColor }]} />
                    <View style={[styles.colorDot, { backgroundColor: item.backgroundColor, borderWidth: 1, borderColor: '#ccc' }]} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Elige tu Estilo</Text>
                {saving && <ActivityIndicator color={colors.primaryColor} />}
            </View>

            <FlatList
                data={publicThemes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={fetchPublicThemes}
                contentContainerStyle={{ padding: 10 }}
                numColumns={2} // Grid layout
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },

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
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    themeName: { fontSize: 16, fontWeight: 'bold' },

    miniBtn: {
        paddingVertical: 5, paddingHorizontal: 10,
        borderRadius: 5, alignSelf: 'flex-start', marginTop: 8
    },

    colorRow: { flexDirection: 'row', gap: 5 },
    colorDot: { width: 20, height: 20, borderRadius: 10 }
});