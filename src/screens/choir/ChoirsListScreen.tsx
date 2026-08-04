// src/screens/choir/ChoirsListScreen.tsx

import React, { useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    useFocusEffect,
    useNavigation,
    type NavigationProp
} from '@react-navigation/native';
import { canManageChoirs } from '../../auth/permissions';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import type { PlatformStackParamList } from '../../navigation/PlatformNavigator';
import { useAdminChoirsStore } from '../../store/useAdminChoirsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { Choir } from '../../types/choir';

export const ChoirsListScreen = () => {
    const navigation = useNavigation<NavigationProp<PlatformStackParamList>>();
    const colors = useTheme().currentTheme;
    const role = useAuthStore((state) => state.user?.role);
    const preferredChoirId = useAuthStore(
        (state) => state.user?.preferredChoirId ?? null
    );
    const hasAccess = canManageChoirs(role);
    const selectChoir = useTargetChoirStore((state) => state.selectChoir);
    const enterChoir = useTargetChoirStore((state) => state.enterChoir);
    const clearSelection = useTargetChoirStore((state) => state.clearSelection);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const {
        choirs,
        fetchChoirs,
        removeChoirAction,
        toggleChoirActiveAction,
        loading,
        refreshing
    } = useAdminChoirsStore();

    useFocusEffect(
        useCallback(() => {
            if (hasAccess) {
                fetchChoirs(true).catch(() => undefined);
            }
        }, [fetchChoirs, hasAccess])
    );


    useEffect(() => {
        const selectedChoirIsAvailable = selectedChoir
            ? choirs.some(
                (choir) => choir.id === selectedChoir.id && choir.isActive
            )
            : false;

        if (selectedChoir && !selectedChoirIsAvailable) {
            clearSelection();
            return;
        }

        if (!selectedChoir && preferredChoirId) {
            const preferredChoir = choirs.find(
                (choir) => choir.id === preferredChoirId && choir.isActive
            );

            if (preferredChoir) {
                selectChoir(preferredChoir);
            }
        }
    }, [
        choirs,
        clearSelection,
        preferredChoirId,
        selectChoir,
        selectedChoir
    ]);

    if (!hasAccess) {
        return <AccessDeniedScreen showBackButton={false} />;
    }

    const openChoirApp = (choir: Choir): void => {
        if (!choir.isActive) {
            Alert.alert('Coro inactivo', 'Activa el coro antes de entrar.');
            return;
        }

        enterChoir(choir);
    };

    const openChoirUsers = (choir: Choir): void => {
        if (!choir.isActive) {
            Alert.alert('Coro inactivo', 'Activa el coro antes de administrar sus usuarios.');
            return;
        }

        selectChoir(choir);
        navigation.navigate('UsersListScreen');
    };

    const openChoirAudit = (choir: Choir): void => {
        if (!choir.isActive) {
            Alert.alert('Coro inactivo', 'Activa el coro antes de consultar su auditoría.');
            return;
        }

        selectChoir(choir);
        navigation.navigate('AuditLogsScreen', { scope: 'tenant' });
    };

    const confirmDeactivate = (choir: Choir): void => {
        Alert.alert(
            'Desactivar coro',
            `¿Deseas desactivar el coro "${choir.name}"? Sus usuarios perderán el acceso hasta que vuelva a activarse.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desactivar',
                    style: 'destructive',
                    onPress: async () => {
                        await removeChoirAction(choir.id);
                        if (selectedChoir?.id === choir.id) {
                            clearSelection();
                        }
                    }
                }
            ]
        );
    };

    const activateChoir = (choir: Choir): void => {
        Alert.alert(
            'Activar coro',
            `¿Deseas activar el coro "${choir.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Activar',
                    onPress: async () => {
                        await toggleChoirActiveAction(choir.id, true);
                    }
                }
            ]
        );
    };

    const renderChoir = ({ item }: { readonly item: Choir }) => {
        const isSelected = selectedChoir?.id === item.id;

        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.cardColor,
                        borderColor: isSelected ? colors.primaryColor : colors.borderColor,
                        opacity: item.isActive ? 1 : 0.68
                    }
                ]}
            >
                <View style={styles.mainRow}>
                    <Image
                        source={{ uri: item.logoUrl || 'https://via.placeholder.com/80?text=C' }}
                        style={styles.logo}
                    />
                    <View style={styles.details}>
                        <Text style={[styles.name, { color: colors.textColor }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.code, { color: colors.secondaryTextColor }]}>
                            Código: {item.code}
                        </Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusPill, { backgroundColor: item.isActive ? '#2E7D32' : '#6B7280' }]}>
                                <Text style={styles.statusText}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
                            </View>
                            {isSelected && (
                                <Text style={[styles.selectedText, { color: colors.primaryColor }]}>Coro seleccionado</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.primaryAction, { backgroundColor: colors.buttonColor }]}
                        onPress={() => openChoirApp(item)}
                    >
                        <Ionicons name="enter-outline" size={17} color={colors.buttonTextColor} />
                        <Text style={[styles.primaryActionText, { color: colors.buttonTextColor }]}>Entrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryAction, { backgroundColor: colors.buttonColor }]}
                        onPress={() => openChoirUsers(item)}
                    >
                        <Ionicons name="people-outline" size={17} color={colors.buttonTextColor} />
                        <Text style={[styles.primaryActionText, { color: colors.buttonTextColor }]}>Usuarios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconAction} onPress={() => openChoirAudit(item)}>
                        <Ionicons name="shield-checkmark-outline" size={21} color={colors.primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconAction}
                        onPress={() => navigation.navigate('ManageChoirScreen', { choirId: item.id })}
                    >
                        <Ionicons name="pencil-outline" size={21} color={colors.primaryColor} />
                    </TouchableOpacity>
                    {item.isActive ? (
                        <TouchableOpacity style={styles.iconAction} onPress={() => confirmDeactivate(item)}>
                            <Ionicons name="power-outline" size={21} color="#C62828" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.iconAction} onPress={() => activateChoir(item)}>
                            <Ionicons name="play-circle-outline" size={22} color="#2E7D32" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textColor }]}>Consola de plataforma</Text>
                    <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>Selecciona un coro para administrar usuarios y auditoría.</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageChoirScreen')}
                >
                    <Ionicons name="add" size={24} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.toolbar}>
                <TouchableOpacity
                    style={[styles.toolbarButton, { borderColor: colors.primaryColor }]}
                    onPress={() => navigation.navigate('AuditLogsScreen', { scope: 'global' })}
                >
                    <Ionicons name="earth-outline" size={20} color={colors.primaryColor} />
                    <Text style={[styles.toolbarText, { color: colors.primaryColor }]}>Auditoría global</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toolbarButton, { borderColor: colors.primaryColor }]}
                    onPress={() => navigation.navigate('PlatformProfileScreen')}
                >
                    <Ionicons name="person-circle-outline" size={20} color={colors.primaryColor} />
                    <Text style={[styles.toolbarText, { color: colors.primaryColor }]}>Mi perfil</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={choirs}
                keyExtractor={(item) => item.id}
                renderItem={renderChoir}
                refreshing={refreshing}
                onRefresh={() => fetchChoirs(true)}
                onEndReached={() => fetchChoirs(false)}
                onEndReachedThreshold={0.4}
                contentContainerStyle={choirs.length === 0 ? styles.emptyContainer : styles.list}
                ListEmptyComponent={loading ? (
                    <ActivityIndicator size="large" color={colors.primaryColor} />
                ) : (
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No se encontraron coros.</Text>
                )}
                ListFooterComponent={loading && choirs.length > 0 ? (
                    <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} />
                ) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18 },
    title: { fontSize: 27, fontWeight: '900' },
    subtitle: { marginTop: 4, maxWidth: 300, fontSize: 13, lineHeight: 18 },
    addButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    toolbar: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
    toolbarButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 4, marginBottom: 8 },
    toolbarText: { marginLeft: 7, fontWeight: '800' },
    list: { paddingHorizontal: 16, paddingBottom: 28 },
    card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
    mainRow: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#D1D5DB' },
    details: { flex: 1, marginLeft: 13 },
    name: { fontSize: 18, fontWeight: '800' },
    code: { marginTop: 3, fontSize: 13 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    selectedText: { marginLeft: 8, fontSize: 11, fontWeight: '800' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 14 },
    primaryAction: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginRight: 6, marginBottom: 6 },
    primaryActionText: { marginLeft: 6, fontSize: 13, fontWeight: '800' },
    iconAction: { padding: 9 },
    emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    emptyText: { fontSize: 16, textAlign: 'center' },
    footerLoader: { paddingVertical: 18 }
});
