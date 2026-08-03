// src/screens/audit/AuditLogsScreen.tsx

import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { canViewAuditLogs, isSuperAdmin } from '../../auth/permissions';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAuditLogsStore } from '../../store/useAuditLogsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { AuditLogEntry, AuditScope } from '../../types/audit';

interface AuditLogsRouteParams {
    readonly scope?: AuditScope;
}

type AuditRoute = RouteProp<
    { readonly AuditLogsScreen: AuditLogsRouteParams | undefined },
    'AuditLogsScreen'
>;

const formatOperation = (operation: string): string => {
    return operation
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const AuditLogsScreen = () => {
    const route = useRoute<AuditRoute>();
    const scope = route.params?.scope ?? 'tenant';
    const colors = useTheme().currentTheme;
    const user = useAuthStore((state) => state.user);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const {
        logs,
        loading,
        refreshing,
        totalLogs,
        errorMessage,
        fetchLogs,
        reset
    } = useAuditLogsStore();
    const hasAccess = canViewAuditLogs(user?.role);
    const requiresTarget = scope === 'tenant' && isSuperAdmin(user?.role);
    const choirId = requiresTarget ? selectedChoir?.id : undefined;

    useFocusEffect(
        useCallback(() => {
            reset();

            if (hasAccess && (!requiresTarget || choirId)) {
                fetchLogs(scope, choirId, true).catch(() => undefined);
            }

            return reset;
        }, [choirId, fetchLogs, hasAccess, requiresTarget, reset, scope])
    );

    if (!hasAccess) {
        return <AccessDeniedScreen />;
    }

    if (requiresTarget && !selectedChoir) {
        return (
            <AccessDeniedScreen
                title="Selecciona un coro"
                message="Debes seleccionar un coro desde la consola de plataforma antes de consultar su auditoría."
            />
        );
    }

    const renderItem = ({ item }: { readonly item: AuditLogEntry }) => (
        <View style={[styles.card, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: colors.primaryColor }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.buttonTextColor} />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.operation, { color: colors.textColor }]}>
                        {formatOperation(item.operation)}
                    </Text>
                    <Text style={[styles.date, { color: colors.secondaryTextColor }]}>
                        {new Date(item.timestamp || item.createdAt).toLocaleString('es-MX')}
                    </Text>
                </View>
            </View>

            <Text style={[styles.detail, { color: colors.textColor }]}>
                Actor: {item.actor?.name ?? item.actorUserId}
                {item.actorRole ? ` (${item.actorRole})` : ''}
            </Text>
            <Text style={[styles.detail, { color: colors.secondaryTextColor }]}>
                Recurso: {item.collectionName} · {item.referenceId}
            </Text>
            <Text style={[styles.detail, { color: colors.secondaryTextColor }]}>
                Coro objetivo: {item.targetChoirId}
            </Text>
            {item.targetUserId && (
                <Text style={[styles.detail, { color: colors.secondaryTextColor }]}>
                    Usuario objetivo: {item.targetUser
                        ? `${item.targetUser.name} (@${item.targetUser.username})`
                        : item.targetUserId}
                </Text>
            )}
            {item.description.length > 0 && (
                <Text style={[styles.detail, { color: colors.secondaryTextColor }]}>
                    {item.description}
                </Text>
            )}
            {item.ipAddress.length > 0 && (
                <Text style={[styles.metadata, { color: colors.secondaryTextColor }]}>
                    IP: {item.ipAddress}
                </Text>
            )}
            {item.deviceId.length > 0 && (
                <Text style={[styles.metadata, { color: colors.secondaryTextColor }]} numberOfLines={1}>
                    Dispositivo: {item.deviceId}
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.heading}>
                <Text style={[styles.title, { color: colors.textColor }]}>Auditoría</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryTextColor }]}>
                    {scope === 'global'
                        ? `${totalLogs} acciones globales registradas`
                        : `${totalLogs} acciones en ${selectedChoir?.name ?? 'tu coro'}`}
                </Text>
            </View>

            {errorMessage && (
                <Text style={styles.error}>{errorMessage}</Text>
            )}

            <FlatList
                data={logs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshing={refreshing}
                onRefresh={() => fetchLogs(scope, choirId, true)}
                onEndReached={() => fetchLogs(scope, choirId)}
                onEndReachedThreshold={0.4}
                contentContainerStyle={logs.length === 0 ? styles.emptyContainer : styles.list}
                ListEmptyComponent={loading ? (
                    <ActivityIndicator size="large" color={colors.primaryColor} />
                ) : (
                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>No hay acciones registradas.</Text>
                )}
                ListFooterComponent={loading && logs.length > 0 ? (
                    <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} />
                ) : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    heading: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800' },
    subtitle: { marginTop: 4, fontSize: 14 },
    list: { paddingHorizontal: 16, paddingBottom: 28 },
    card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1, marginLeft: 10 },
    operation: { fontSize: 16, fontWeight: '800' },
    date: { marginTop: 2, fontSize: 12 },
    detail: { fontSize: 14, lineHeight: 20 },
    metadata: { marginTop: 6, fontSize: 11 },
    error: { color: '#C62828', paddingHorizontal: 20, marginBottom: 8 },
    emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    emptyText: { fontSize: 16, textAlign: 'center' },
    footerLoader: { paddingVertical: 18 }
});
