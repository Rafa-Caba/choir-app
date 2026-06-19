import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAdminChoirsStore } from '../../store/useAdminChoirsStore';
import { useTheme } from '../../context/ThemeContext';
import type { Choir } from '../../types/choir';

type Nav = any;

export const ChoirsListScreen = () => {
    const navigation = useNavigation<Nav>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const {
        choirs,
        fetchChoirs,
        removeChoirAction,
        toggleChoirActiveAction,
        loading,
        refreshing,
    } = useAdminChoirsStore();

    // Refresh when screen gains focus
    useFocusEffect(
        useCallback(() => {
            fetchChoirs(true);
        }, [])
    );

    const handleEdit = (choir: Choir) => {
        navigation.navigate('ManageChoirScreen', { choirId: choir.id });
    };

    const handleDelete = (choir: Choir) => {
        const message = `¿Estás seguro de eliminar el coro "${choir.name}"? Esta acción no se puede deshacer.`;

        if (Platform.OS === 'web') {
            // @ts-ignore
            const confirm = window.confirm(message);
            if (confirm) removeChoirAction(choir.id);
            return;
        }

        Alert.alert('Eliminar Coro', message, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => removeChoirAction(choir.id),
            },
        ]);
    };

    const handleToggleActive = (choir: Choir) => {
        const nextState = !choir.isActive;
        const actionText = nextState ? 'activar' : 'desactivar';
        const title = nextState ? 'Activar Coro' : 'Desactivar Coro';
        const message = `¿Estás seguro de ${actionText} el coro "${choir.name}"?`;

        if (Platform.OS === 'web') {
            // @ts-ignore
            const confirm = window.confirm(message);
            if (confirm) toggleChoirActiveAction(choir.id, nextState);
            return;
        }

        Alert.alert(title, message, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: nextState ? 'Activar' : 'Desactivar',
                style: nextState ? 'default' : 'destructive',
                onPress: () => toggleChoirActiveAction(choir.id, nextState),
            },
        ]);
    };

    const renderItem = ({ item }: { item: Choir }) => (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardColor,
                    opacity: item.isActive ? 1 : 0.6,
                },
            ]}
        >
            <TouchableOpacity style={styles.cardContent} onPress={() => handleEdit(item)}>
                <View style={styles.logoWrap}>
                    <Image
                        source={{ uri: item.logoUrl || 'https://via.placeholder.com/80?text=C' }}
                        style={styles.logo}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.textColor }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <View style={styles.metaRow}>
                        <View
                            style={[
                                styles.pill,
                                { backgroundColor: colors.cardColor || '#EFEFEF' },
                            ]}
                        >
                            <Ionicons
                                name="key-outline"
                                size={14}
                                color={colors.secondaryTextColor}
                            />
                            <Text
                                style={[
                                    styles.pillText,
                                    { color: colors.secondaryTextColor },
                                ]}
                            >
                                {item.code}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statusPill,
                                {
                                    backgroundColor: item.isActive ? '#2E7D32' : '#6B7280',
                                },
                            ]}
                        >
                            <Text style={styles.statusText}>
                                {item.isActive ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>

                    {!!item.description && (
                        <Text
                            style={[
                                styles.description,
                                { color: colors.secondaryTextColor },
                            ]}
                            numberOfLines={2}
                        >
                            {item.description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                {/* Activate / Deactivate */}
                <TouchableOpacity
                    onPress={() => handleToggleActive(item)}
                    style={styles.actionBtn}
                >
                    <Ionicons
                        name={
                            item.isActive
                                ? 'pause-circle-outline'
                                : 'play-circle-outline'
                        }
                        size={22}
                        color={item.isActive ? '#F57C00' : '#2E7D32'}
                    />
                </TouchableOpacity>

                {/* Edit */}
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.actionBtn}
                >
                    <Ionicons
                        name="pencil"
                        size={20}
                        color={colors.primaryColor}
                    />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.actionBtn}
                >
                    <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#E91E63"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!loading || refreshing) return null;
        return (
            <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator
                    size="small"
                    color={colors.primaryColor}
                />
            </View>
        );
    };

    if (loading && choirs.length === 0) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.backgroundColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={colors.primaryColor}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>
                    Coros
                </Text>

                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageChoirScreen')}
                >
                    <Ionicons
                        name="add"
                        size={24}
                        color={colors.buttonTextColor}
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={choirs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={refreshing}
                onRefresh={() => fetchChoirs(true)}
                onEndReached={() => fetchChoirs(false)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text
                        style={[
                            styles.emptyText,
                            { color: colors.secondaryTextColor },
                        ]}
                    >
                        No se encontraron coros.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 10 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        marginTop: 10,
    },

    title: { fontSize: 28, fontWeight: 'bold' },
    addBtn: { padding: 12, borderRadius: 25, elevation: 3 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        marginBottom: 12,
        elevation: 2,
        overflow: 'hidden',
    },

    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },

    logoWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        marginRight: 14,
        backgroundColor: '#DDD',
    },

    logo: { width: '100%', height: '100%' },

    name: { fontSize: 16, fontWeight: 'bold' },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6,
        alignSelf: 'flex-start',
    },

    pillText: { fontSize: 12, fontWeight: '700' },

    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },

    statusText: { color: 'white', fontSize: 12, fontWeight: '800' },

    description: { marginTop: 8, fontSize: 12 },

    actions: { flexDirection: 'row', paddingRight: 10 },
    actionBtn: { padding: 8 },

    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
});
