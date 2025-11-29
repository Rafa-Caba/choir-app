import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useThemeStore } from '../../../store/useThemeStore';

export const ThemesListScreen = () => {
    const navigation = useNavigation<any>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { themes, fetchThemes, removeTheme, loading } = useThemeStore();

    useEffect(() => {
        fetchThemes();
    }, []);

    const handleDelete = (id: string, name: string) => {
        Alert.alert("Delete Theme", `Delete "${name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => removeTheme(id) }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: colors.cardColor }]}>
            <View style={styles.previewContainer}>
                <View style={[styles.colorPreview, { backgroundColor: item.primaryColor }]} />
                <View style={[styles.colorPreview, { backgroundColor: item.backgroundColor }]} />
                <View style={[styles.colorPreview, { backgroundColor: item.accentColor }]} />
            </View>

            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.textColor }]}>{item.name}</Text>
                <Text style={[styles.type, { color: colors.secondaryTextColor }]}>
                    {item.isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => navigation.navigate('ManageThemeScreen', { themeToEdit: item })} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Themes</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageThemeScreen')}
                >
                    <Ionicons name="add" size={24} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={themes}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={fetchThemes}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    addBtn: { padding: 10, borderRadius: 25, elevation: 3 },
    card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 10, padding: 15, elevation: 2 },
    previewContainer: { flexDirection: 'row', gap: 5, marginRight: 15 },
    colorPreview: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    type: { fontSize: 12 },
    actions: { flexDirection: 'row' },
    actionBtn: { padding: 8 }
});