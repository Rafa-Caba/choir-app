// src/screens/settings/MediaStorageScreen.tsx

import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import {
    clearTemporaryMedia,
    formatMediaBytes,
    getMediaStorageStats
} from '../../storage/mediaStorage';
import {
    DEFAULT_MEDIA_STORAGE_PREFERENCES,
    loadMediaStoragePreferences,
    saveMediaStoragePreferences
} from '../../storage/mediaStoragePreferences';
import { useAuthStore } from '../../store/useAuthStore';
import type {
    MediaAutoDownloadPolicy,
    MediaStoragePreferences,
    MediaStorageStats
} from '../../types/mediaStorage';

interface AutoDownloadOption {
    readonly id: MediaAutoDownloadPolicy;
    readonly label: string;
    readonly description: string;
}

const autoDownloadOptions: readonly AutoDownloadOption[] = [
    {
        id: 'NEVER',
        label: 'Nunca',
        description: 'Los archivos solo se descargan cuando eliges una acción.'
    },
    {
        id: 'WIFI_ONLY',
        label: 'Solo Wi-Fi',
        description: 'Ahorra datos móviles y mantiene disponible lo reciente.'
    },
    {
        id: 'ALWAYS',
        label: 'Siempre',
        description: 'Descarga automáticamente con Wi-Fi o datos móviles.'
    }
];

const emptyStats: MediaStorageStats = {
    totalBytes: 0,
    cachedBytes: 0,
    downloadedBytes: 0,
    fileCount: 0,
    cachedFileCount: 0,
    downloadedFileCount: 0
};

const displayBytes = (bytes: number): string => {
    return bytes > 0 ? formatMediaBytes(bytes) : '0 B';
};

export const MediaStorageScreen = () => {
    const colors = useTheme().currentTheme;
    const getTenantContext = useAuthStore((state) => state.getTenantContext);
    const [preferences, setPreferences] = useState<MediaStoragePreferences>(
        DEFAULT_MEDIA_STORAGE_PREFERENCES
    );
    const [stats, setStats] = useState<MediaStorageStats>(emptyStats);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);

    const refresh = useCallback(async (): Promise<void> => {
        const context = getTenantContext();

        if (!context) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const [nextPreferences, nextStats] = await Promise.all([
                loadMediaStoragePreferences(context),
                getMediaStorageStats(context)
            ]);
            setPreferences(nextPreferences);
            setStats(nextStats);
        } finally {
            setLoading(false);
        }
    }, [getTenantContext]);

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh])
    );

    const persistPreferences = async (
        next: Pick<MediaStoragePreferences, 'autoDownload' | 'keepDownloadedFiles'>
    ): Promise<void> => {
        const context = getTenantContext();

        if (!context || saving) {
            return;
        }

        const previous = preferences;
        const optimistic: MediaStoragePreferences = {
            version: 1,
            autoDownload: next.autoDownload,
            keepDownloadedFiles: next.keepDownloadedFiles,
            updatedAt: new Date().toISOString()
        };
        setPreferences(optimistic);
        setSaving(true);

        try {
            setPreferences(await saveMediaStoragePreferences(context, next));
        } catch {
            setPreferences(previous);
            Alert.alert('Error', 'No fue posible guardar la preferencia.');
        } finally {
            setSaving(false);
        }
    };

    const confirmClearCache = (): void => {
        Alert.alert(
            'Borrar caché',
            'Se eliminarán los archivos temporales. Las copias que guardaste en Choir App no se borrarán.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar caché',
                    style: 'destructive',
                    onPress: () => {
                        void clearCache();
                    }
                }
            ]
        );
    };

    const clearCache = async (): Promise<void> => {
        const context = getTenantContext();

        if (!context || clearing) {
            return;
        }

        setClearing(true);

        try {
            await clearTemporaryMedia(context);
            setStats(await getMediaStorageStats(context));
            Alert.alert('Caché borrada', 'Los archivos temporales se eliminaron correctamente.');
        } catch {
            Alert.alert('Error', 'No fue posible borrar la caché.');
        } finally {
            setClearing(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundColor }]}>
                <ActivityIndicator color={colors.primaryColor} />
                <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
                    Calculando almacenamiento...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.backgroundColor }]}
            contentContainerStyle={styles.content}
        >
            <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Descarga automática
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.secondaryTextColor }]}>
                Define cuándo Choir App puede conservar multimedia temporalmente para abrirla más rápido y usarla parcialmente sin conexión.
            </Text>

            <View
                style={[
                    styles.card,
                    { backgroundColor: colors.cardColor, borderColor: colors.borderColor }
                ]}
            >
                {autoDownloadOptions.map((option, index) => {
                    const selected = preferences.autoDownload === option.id;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionRow,
                                index > 0 ? { borderTopColor: colors.borderColor, borderTopWidth: 1 } : undefined
                            ]}
                            disabled={saving}
                            onPress={() => void persistPreferences({
                                autoDownload: option.id,
                                keepDownloadedFiles: preferences.keepDownloadedFiles
                            })}
                        >
                            <Ionicons
                                name={selected ? 'radio-button-on' : 'radio-button-off'}
                                size={23}
                                color={selected ? colors.primaryColor : colors.secondaryTextColor}
                            />
                            <View style={styles.optionText}>
                                <Text style={[styles.optionLabel, { color: colors.textColor }]}>
                                    {option.label}
                                </Text>
                                <Text style={[styles.optionDescription, { color: colors.secondaryTextColor }]}>
                                    {option.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Archivos descargados
            </Text>
            <View
                style={[
                    styles.card,
                    { backgroundColor: colors.cardColor, borderColor: colors.borderColor }
                ]}
            >
                <View style={styles.switchRow}>
                    <View style={styles.switchText}>
                        <Text style={[styles.optionLabel, { color: colors.textColor }]}>
                            Conservar archivos descargados
                        </Text>
                        <Text style={[styles.optionDescription, { color: colors.secondaryTextColor }]}>
                            Las acciones de guardar crean copias dentro del almacenamiento de Choir App.
                        </Text>
                    </View>
                    <View style={styles.switchControlContainer}>
                        <Switch
                            style={Platform.OS === 'ios' ? styles.iosSwitch : undefined}
                            value={preferences.keepDownloadedFiles}
                            disabled={saving}
                            onValueChange={(value) => void persistPreferences({
                                autoDownload: preferences.autoDownload,
                                keepDownloadedFiles: value
                            })}
                            trackColor={{ false: '#767577', true: colors.primaryColor }}
                        />
                    </View>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                Espacio utilizado
            </Text>
            <View
                style={[
                    styles.card,
                    { backgroundColor: colors.cardColor, borderColor: colors.borderColor }
                ]}
            >
                <View style={styles.totalRow}>
                    <View>
                        <Text style={[styles.totalLabel, { color: colors.secondaryTextColor }]}>Choir App</Text>
                        <Text style={[styles.totalValue, { color: colors.textColor }]}>
                            {displayBytes(stats.totalBytes)}
                        </Text>
                    </View>
                    <Ionicons name="server-outline" size={30} color={colors.primaryColor} />
                </View>
                <View style={[styles.separator, { backgroundColor: colors.borderColor }]} />
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textColor }]}>Caché temporal</Text>
                    <Text style={[styles.statValue, { color: colors.secondaryTextColor }]}>
                        {displayBytes(stats.cachedBytes)} · {stats.cachedFileCount} archivos
                    </Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textColor }]}>Copias guardadas</Text>
                    <Text style={[styles.statValue, { color: colors.secondaryTextColor }]}>
                        {displayBytes(stats.downloadedBytes)} · {stats.downloadedFileCount} archivos
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.clearButton,
                    { borderColor: colors.borderColor, backgroundColor: colors.cardColor }
                ]}
                disabled={clearing || stats.cachedFileCount === 0}
                onPress={confirmClearCache}
            >
                {clearing ? (
                    <ActivityIndicator color="#C62828" />
                ) : (
                    <Ionicons name="trash-outline" size={22} color="#C62828" />
                )}
                <Text style={styles.clearButtonText}>Borrar caché</Text>
            </TouchableOpacity>

            <Text style={[styles.note, { color: colors.secondaryTextColor }]}>
                Cloudinary permanece como fuente oficial. Borrar archivos locales no elimina contenido del coro.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 18, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 6 },
    sectionDescription: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
    card: { borderWidth: 1, borderRadius: 16 },
    optionRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', padding: 14 },
    optionText: { flex: 1, marginLeft: 12 },
    optionLabel: { fontSize: 15, fontWeight: '700' },
    optionDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
    switchRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 14 },
    switchText: { flex: 1, marginRight: 14 },
    switchControlContainer: {
        width: 76,
        minWidth: 76,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 4,
        overflow: 'visible'
    },
    iosSwitch: { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    totalLabel: { fontSize: 12, fontWeight: '700' },
    totalValue: { fontSize: 26, fontWeight: '900', marginTop: 3 },
    separator: { height: 1, marginHorizontal: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    statLabel: { fontSize: 14, fontWeight: '600' },
    statValue: { fontSize: 12 },
    clearButton: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18
    },
    clearButtonText: { color: '#C62828', fontSize: 15, fontWeight: '800', marginLeft: 8 },
    note: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 16 }
});
