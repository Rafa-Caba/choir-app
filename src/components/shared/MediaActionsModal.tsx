// src/components/shared/MediaActionsModal.tsx

import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useMediaResource } from '../../hooks/useMediaResource';
import {
    openLocalMediaWithNativeSheet,
    saveLocalMediaToFiles,
    saveLocalMediaToPhotos,
    shareLocalMedia
} from '../../services/mediaActions';
import { formatMediaBytes } from '../../storage/mediaStorage';
import type { MediaKind } from '../../types/mediaStorage';
import type { MediaCacheCategory } from '../../types/sync';

interface MediaActionsModalProps {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly remoteUrl: string;
    readonly filename?: string;
    readonly mimeType?: string;
    readonly kind: MediaKind;
    readonly category: MediaCacheCategory;
    readonly initialBytes?: number;
}

type MediaActionKey =
    | 'SAVE_PHOTOS'
    | 'SHARE'
    | 'DOWNLOAD'
    | 'OPEN_WITH'
    | 'SAVE_FILES';

interface ActionDefinition {
    readonly key: MediaActionKey;
    readonly label: string;
    readonly icon: keyof typeof Ionicons.glyphMap;
}

const defaultFilenameByKind: Readonly<Record<MediaKind, string>> = {
    IMAGE: 'imagen.jpg',
    VIDEO: 'video.mp4',
    AUDIO: 'audio.m4a',
    DOCUMENT: 'archivo'
};

export const MediaActionsModal = ({
    visible,
    onClose,
    remoteUrl,
    filename,
    mimeType,
    kind,
    category,
    initialBytes = 0
}: MediaActionsModalProps) => {
    const colors = useTheme().currentTheme;
    const [activeAction, setActiveAction] = useState<MediaActionKey | null>(null);
    const resource = useMediaResource({
        remoteUrl,
        filename,
        mimeType,
        kind,
        category
    });
    const resolvedFilename = resource.record?.filename ?? filename ?? defaultFilenameByKind[kind];
    const bytes = resource.record?.bytes ?? initialBytes;
    const actions = useMemo<readonly ActionDefinition[]>(() => {
        if (kind === 'IMAGE' || kind === 'VIDEO') {
            return [
                { key: 'SAVE_PHOTOS', label: 'Guardar en Fotos', icon: 'images-outline' },
                { key: 'SHARE', label: 'Compartir', icon: 'share-outline' },
                { key: 'DOWNLOAD', label: 'Descargar al dispositivo', icon: 'download-outline' }
            ];
        }

        if (kind === 'DOCUMENT') {
            return [
                { key: 'OPEN_WITH', label: 'Abrir con…', icon: 'open-outline' },
                { key: 'SAVE_FILES', label: 'Guardar en Archivos', icon: 'folder-outline' },
                { key: 'SHARE', label: 'Compartir', icon: 'share-outline' }
            ];
        }

        return [
            { key: 'SHARE', label: 'Compartir', icon: 'share-outline' },
            { key: 'DOWNLOAD', label: 'Guardar archivo', icon: 'download-outline' }
        ];
    }, [kind]);

    const runAction = async (key: MediaActionKey): Promise<void> => {
        if (!remoteUrl || activeAction) {
            return;
        }

        setActiveAction(key);

        try {
            if (key === 'SAVE_PHOTOS') {
                const local = await resource.ensureLocalFile();
                await saveLocalMediaToPhotos(local.localUri, kind);
                Alert.alert('Listo', 'El archivo se guardó en Fotos.');
            } else if (key === 'SHARE') {
                const local = await resource.ensureLocalFile();
                await shareLocalMedia(
                    local.localUri,
                    local.mimeType
                );
            } else if (key === 'DOWNLOAD') {
                const local = await resource.ensureLocalFile('DOCUMENTS');
                Alert.alert(
                    'Descarga completada',
                    `${local.filename} quedó guardado en Choir App.`
                );
            } else if (key === 'OPEN_WITH') {
                const local = await resource.ensureLocalFile();
                await openLocalMediaWithNativeSheet(
                    local.localUri,
                    local.mimeType
                );
            } else {
                const local = await resource.ensureLocalFile('DOCUMENTS');
                await saveLocalMediaToFiles(
                    local.localUri,
                    local.mimeType
                );
            }
        } catch (error) {
            Alert.alert(
                'Error',
                error instanceof Error
                    ? error.message
                    : 'No fue posible completar la acción.'
            );
        } finally {
            setActiveAction(null);
        }
    };

    const statusText = resource.state === 'DOWNLOADING'
        ? `Descargando ${Math.round((resource.progress?.fraction ?? 0) * 100)}%`
        : resource.record
            ? resource.record.location === 'DOCUMENTS'
                ? 'Guardado en el dispositivo'
                : 'Disponible sin conexión'
            : 'Se descargará antes de continuar';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.sheet, { backgroundColor: colors.cardColor }]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text
                                numberOfLines={1}
                                style={[styles.title, { color: colors.textColor }]}
                            >
                                {resolvedFilename}
                            </Text>
                            <Text style={[styles.meta, { color: colors.secondaryTextColor }]}> 
                                {formatMediaBytes(bytes)} · {statusText}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            accessibilityLabel="Cerrar acciones de archivo"
                        >
                            <Ionicons name="close" size={25} color={colors.textColor} />
                        </TouchableOpacity>
                    </View>

                    {resource.state === 'DOWNLOADING' && (
                        <View style={[styles.progressTrack, { backgroundColor: colors.borderColor }]}> 
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.primaryColor,
                                        width: `${Math.max(
                                            2,
                                            Math.round((resource.progress?.fraction ?? 0) * 100)
                                        )}%`
                                    }
                                ]}
                            />
                        </View>
                    )}

                    <View style={styles.actions}>
                        {actions.map((action) => {
                            const busy = activeAction === action.key;
                            return (
                                <TouchableOpacity
                                    key={action.key}
                                    style={styles.actionRow}
                                    onPress={() => void runAction(action.key)}
                                    disabled={activeAction !== null}
                                    activeOpacity={0.65}
                                >
                                    <View
                                        style={[
                                            styles.actionIcon,
                                            { backgroundColor: colors.backgroundColor }
                                        ]}
                                    >
                                        {busy ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.primaryColor}
                                            />
                                        ) : (
                                            <Ionicons
                                                name={action.icon}
                                                size={23}
                                                color={colors.primaryColor}
                                            />
                                        )}
                                    </View>
                                    <Text style={[styles.actionText, { color: colors.textColor }]}> 
                                        {action.label}
                                    </Text>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={18}
                                        color={colors.secondaryTextColor}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.borderColor }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelText, { color: colors.secondaryTextColor }]}> 
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    sheet: {
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    headerText: {
        flex: 1,
        marginRight: 14
    },
    title: {
        fontSize: 18,
        fontWeight: '800'
    },
    meta: {
        marginTop: 4,
        fontSize: 12
    },
    progressTrack: {
        height: 5,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 16
    },
    progressFill: {
        height: '100%',
        borderRadius: 3
    },
    actions: {
        marginTop: 14
    },
    actionRow: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center'
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionText: {
        flex: 1,
        marginLeft: 14,
        fontSize: 16,
        fontWeight: '600'
    },
    cancelButton: {
        minHeight: 48,
        borderTopWidth: 1,
        marginTop: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '700'
    }
});
