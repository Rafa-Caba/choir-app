// src/screens/admin/UsersListScreen.tsx

import React, { useCallback } from 'react';
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
import { canManageUsers, isSuperAdmin } from '../../auth/permissions';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { User } from '../../types/auth';

type UserManagementParamList = {
    readonly UsersListScreen: undefined;
    readonly ManageUserScreen: { readonly user?: User } | undefined;
};

export const UsersListScreen = () => {
    const navigation = useNavigation<NavigationProp<UserManagementParamList>>();
    const colors = useTheme().currentTheme;
    const currentUser = useAuthStore((state) => state.user);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const {
        users,
        fetchUsers,
        removeUserAction,
        setUserActiveAction,
        resetPasswordAction,
        reset,
        loading,
        refreshing
    } = useAdminUsersStore();
    const hasAccess = canManageUsers(currentUser?.role);
    const requiresTarget = isSuperAdmin(currentUser?.role);

    useFocusEffect(
        useCallback(() => {
            reset();

            if (hasAccess && (!requiresTarget || selectedChoir)) {
                fetchUsers(true).catch(() => undefined);
            }

            return reset;
        }, [fetchUsers, hasAccess, requiresTarget, reset, selectedChoir])
    );

    if (!hasAccess) {
        return <AccessDeniedScreen />;
    }

    if (requiresTarget && !selectedChoir) {
        return (
            <AccessDeniedScreen
                title="Selecciona un coro"
                message="Debes seleccionar un coro desde la consola de plataforma antes de administrar usuarios."
            />
        );
    }

    const toggleUser = (user: User): void => {
        const nextStatus = !user.isActive;
        Alert.alert(
            nextStatus ? 'Activar usuario' : 'Suspender usuario',
            `¿Deseas ${nextStatus ? 'activar' : 'suspender'} a ${user.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: nextStatus ? 'Activar' : 'Suspender',
                    style: nextStatus ? 'default' : 'destructive',
                    onPress: async () => {
                        const success = await setUserActiveAction(user.id, nextStatus);
                        if (!success) {
                            Alert.alert('Error', 'No fue posible cambiar el estado del usuario.');
                        }
                    }
                }
            ]
        );
    };

    const resetPassword = (user: User): void => {
        Alert.alert(
            'Restablecer contraseña',
            `Se generará una contraseña temporal para ${user.name} y se cerrarán sus sesiones activas.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restablecer',
                    onPress: async () => {
                        const temporaryPassword = await resetPasswordAction(user.id);
                        Alert.alert(
                            temporaryPassword ? 'Contraseña temporal' : 'Error',
                            temporaryPassword ?? 'No fue posible restablecer la contraseña.'
                        );
                    }
                }
            ]
        );
    };

    const removeUser = (user: User): void => {
        Alert.alert(
            'Eliminar usuario',
            `¿Deseas eliminar a ${user.name}? Esta acción revocará todas sus sesiones.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await removeUserAction(user.id);
                        if (!success) {
                            Alert.alert('Error', 'No fue posible eliminar el usuario.');
                        }
                    }
                }
            ]
        );
    };

    const renderUser = ({ item }: { readonly item: User }) => (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardColor,
                    borderColor: colors.borderColor,
                    opacity: item.isActive ? 1 : 0.65
                }
            ]}
        >
            <TouchableOpacity
                style={styles.cardContent}
                onPress={() => navigation.navigate('ManageUserScreen', { user: item })}
            >
                <Image
                    source={{ uri: item.cachedImageUrl ?? item.imageUrl ?? 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.userDetails}>
                    <Text style={[styles.name, { color: colors.textColor }]}>{item.name}</Text>
                    <Text style={[styles.role, { color: colors.secondaryTextColor }]}>@{item.username} · {item.role}</Text>
                    <Text style={[styles.status, { color: item.isActive ? '#2E7D32' : '#C62828' }]}>
                        {item.isActive ? 'Activo' : 'Suspendido'}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => resetPassword(item)}>
                    <Ionicons name="key-outline" size={20} color={colors.primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => toggleUser(item)}>
                    <Ionicons
                        name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={21}
                        color={item.isActive ? '#F57C00' : '#2E7D32'}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ManageUserScreen', { user: item })}
                >
                    <Ionicons name="pencil-outline" size={20} color={colors.primaryColor} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => removeUser(item)}>
                    <Ionicons name="trash-outline" size={20} color="#C62828" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.textColor }]}>Usuarios</Text>
                    <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
                        {selectedChoir?.name ?? 'Administración de tu coro'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('ManageUserScreen')}
                >
                    <Ionicons name="person-add-outline" size={21} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                refreshing={refreshing}
                onRefresh={() => fetchUsers(true)}
                onEndReached={() => fetchUsers(false)}
                onEndReachedThreshold={0.4}
                contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.list}
                ListEmptyComponent={loading ? (
                    <ActivityIndicator size="large" color={colors.primaryColor} />
                ) : (
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No hay usuarios registrados.</Text>
                )}
                ListFooterComponent={loading && users.length > 0 ? (
                    <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} />
                ) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
    title: { fontSize: 28, fontWeight: '900' },
    subtitle: { marginTop: 3, fontSize: 13 },
    addButton: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 28 },
    card: { borderWidth: 1, borderRadius: 14, marginBottom: 11, overflow: 'hidden' },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#D1D5DB' },
    userDetails: { flex: 1, marginLeft: 12 },
    name: { fontSize: 16, fontWeight: '800' },
    role: { marginTop: 2, fontSize: 12 },
    status: { marginTop: 4, fontSize: 12, fontWeight: '800' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 8, paddingBottom: 8 },
    actionButton: { padding: 9 },
    emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    emptyText: { fontSize: 16, textAlign: 'center' },
    footerLoader: { paddingVertical: 18 }
});
