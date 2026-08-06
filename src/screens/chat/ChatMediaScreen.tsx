// src/screens/chat/ChatMediaScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
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
import { Audio, ResizeMode, Video } from 'expo-av';
import { MediaActionsModal } from '../../components/shared/MediaActionsModal';
import { MediaViewerModal } from '../../components/shared/MediaViewerModal';
import { useTheme } from '../../context/ThemeContext';
import { useChatMediaQuery } from '../../hooks/query/useChatData';
import { useMediaResource } from '../../hooks/useMediaResource';
import { formatMediaBytes } from '../../storage/mediaStorage';
import type { ChatMessage } from '../../types/chat';
import type { MediaKind } from '../../types/mediaStorage';

type ChatMediaFilter = 'ALL' | 'VISUAL' | 'DOCUMENT' | 'AUDIO';

interface FilterDefinition {
    readonly id: ChatMediaFilter;
    readonly label: string;
}

const filters: readonly FilterDefinition[] = [
    { id: 'ALL', label: 'Todo' },
    { id: 'VISUAL', label: 'Fotos y videos' },
    { id: 'DOCUMENT', label: 'Archivos' },
    { id: 'AUDIO', label: 'Audio' }
];

const getMediaKind = (message: ChatMessage): MediaKind => {
    switch (message.type) {
        case 'IMAGE':
            return 'IMAGE';
        case 'VIDEO':
            return 'VIDEO';
        case 'MEDIA':
            return message.media?.mimeType.startsWith('audio/') || Boolean(message.audioUrl)
                ? 'AUDIO'
                : 'VIDEO';
        case 'AUDIO':
            return 'AUDIO';
        default:
            return 'DOCUMENT';
    }
};

const getMediaUrl = (message: ChatMessage): string => {
    return message.cachedMediaUrl ||
        message.media?.url ||
        message.fileUrl ||
        message.imageUrl ||
        message.audioUrl ||
        '';
};

const getDefaultMimeType = (kind: MediaKind): string => {
    switch (kind) {
        case 'IMAGE':
            return 'image/jpeg';
        case 'VIDEO':
            return 'video/mp4';
        case 'AUDIO':
            return 'audio/mp4';
        case 'DOCUMENT':
            return 'application/octet-stream';
    }
};

const matchesFilter = (
    message: ChatMessage,
    filter: ChatMediaFilter
): boolean => {
    if (filter === 'ALL') {
        return true;
    }

    const kind = getMediaKind(message);

    if (filter === 'VISUAL') {
        return kind === 'IMAGE' || kind === 'VIDEO';
    }

    if (filter === 'AUDIO') {
        return kind === 'AUDIO';
    }

    return kind === 'DOCUMENT';
};

interface ChatMediaCardProps {
    readonly message: ChatMessage;
}

const ChatMediaCard = ({ message }: ChatMediaCardProps) => {
    const colors = useTheme().currentTheme;
    const [viewerVisible, setViewerVisible] = useState(false);
    const [actionsVisible, setActionsVisible] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const kind = getMediaKind(message);
    const remoteUrl = getMediaUrl(message);
    const filename = message.media?.filename || message.filename ||
        (kind === 'IMAGE' ? 'imagen.jpg' :
            kind === 'VIDEO' ? 'video.mp4' :
                kind === 'AUDIO' ? 'audio.m4a' : 'archivo');
    const mimeType = message.media?.mimeType || getDefaultMimeType(kind);
    const initialBytes = message.media?.bytes ?? 0;
    const resource = useMediaResource({
        remoteUrl,
        filename,
        mimeType,
        kind,
        category: 'chat',
        autoDownload: false
    });
    const dateLabel = new Date(message.createdAt).toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    const statusLabel = resource.record
        ? resource.record.location === 'DOCUMENTS'
            ? 'Guardado'
            : 'En caché'
        : 'En la nube';

    useEffect(() => {
        return () => {
            if (sound) {
                void sound.unloadAsync();
            }
        };
    }, [sound]);

    const toggleAudio = async (): Promise<void> => {
        if (!remoteUrl) {
            return;
        }

        try {
            if (sound) {
                if (audioPlaying) {
                    await sound.pauseAsync();
                } else {
                    await sound.playAsync();
                }
                setAudioPlaying(!audioPlaying);
                return;
            }

            setAudioLoading(true);
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const created = await Audio.Sound.createAsync(
                { uri: resource.displayUri },
                { shouldPlay: true },
                (status) => {
                    if (!status.isLoaded) {
                        return;
                    }

                    setAudioPlaying(status.isPlaying);

                    if (status.didJustFinish) {
                        setAudioPlaying(false);
                    }
                }
            );
            setSound(created.sound);
            setAudioPlaying(true);
        } catch {
            setAudioPlaying(false);
            Alert.alert('Error', 'No fue posible reproducir el audio.');
        } finally {
            setAudioLoading(false);
        }
    };

    const openPrimaryAction = (): void => {
        if (kind === 'IMAGE' || kind === 'VIDEO') {
            setViewerVisible(true);
        } else if (kind === 'AUDIO') {
            void toggleAudio();
        } else {
            setActionsVisible(true);
        }
    };

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardColor,
                    borderColor: colors.borderColor
                }
            ]}
        >
            {(kind === 'IMAGE' || kind === 'VIDEO') && (
                <MediaViewerModal
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    mediaUrl={remoteUrl}
                    mediaType={kind === 'VIDEO' ? 'video' : 'image'}
                    filename={filename}
                    mimeType={mimeType}
                    category="chat"
                    initialBytes={initialBytes}
                />
            )}

            <MediaActionsModal
                visible={actionsVisible}
                onClose={() => setActionsVisible(false)}
                remoteUrl={remoteUrl}
                filename={filename}
                mimeType={mimeType}
                kind={kind}
                category="chat"
                initialBytes={initialBytes}
            />

            <TouchableOpacity
                style={styles.cardMain}
                onPress={openPrimaryAction}
                activeOpacity={0.75}
            >
                <View
                    style={[
                        styles.preview,
                        { backgroundColor: colors.backgroundColor }
                    ]}
                >
                    {kind === 'IMAGE' ? (
                        <Image
                            source={{ uri: resource.displayUri }}
                            style={styles.previewImage}
                            resizeMode="cover"
                        />
                    ) : kind === 'VIDEO' ? (
                        <>
                            <Video
                                source={{ uri: resource.displayUri }}
                                style={styles.previewImage}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isMuted
                            />
                            <View style={styles.previewOverlay}>
                                <Ionicons name="play-circle" size={34} color="#ffffff" />
                            </View>
                        </>
                    ) : (
                        <Ionicons
                            name={kind === 'AUDIO' ? 'mic' : 'document-text'}
                            size={32}
                            color={colors.primaryColor}
                        />
                    )}
                </View>

                <View style={styles.cardText}>
                    <Text
                        numberOfLines={1}
                        style={[styles.filename, { color: colors.textColor }]}
                    >
                        {filename}
                    </Text>
                    <Text
                        numberOfLines={1}
                        style={[styles.metadata, { color: colors.secondaryTextColor }]}
                    >
                        {message.author.name} · {dateLabel}
                    </Text>
                    <Text style={[styles.metadata, { color: colors.secondaryTextColor }]}>
                        {formatMediaBytes(resource.record?.bytes ?? initialBytes)} · {statusLabel}
                    </Text>
                </View>

                {kind === 'AUDIO' && audioLoading ? (
                    <ActivityIndicator color={colors.primaryColor} />
                ) : kind === 'AUDIO' ? (
                    <Ionicons
                        name={audioPlaying ? 'pause-circle' : 'play-circle'}
                        size={31}
                        color={colors.primaryColor}
                    />
                ) : (
                    <Ionicons
                        name="chevron-forward"
                        size={21}
                        color={colors.secondaryTextColor}
                    />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.moreRow}
                onPress={() => setActionsVisible(true)}
                accessibilityLabel="Abrir acciones del archivo"
            >
                <Ionicons
                    name="ellipsis-horizontal"
                    size={22}
                    color={colors.primaryColor}
                />
                <Text style={[styles.moreText, { color: colors.primaryColor }]}>Acciones</Text>
            </TouchableOpacity>
        </View>
    );
};

export const ChatMediaScreen = () => {
    const colors = useTheme().currentTheme;
    const [filter, setFilter] = useState<ChatMediaFilter>('ALL');
    const mediaQuery = useChatMediaQuery(true);
    const media = useMemo(
        () => (mediaQuery.data ?? []).filter((message) => matchesFilter(message, filter)),
        [filter, mediaQuery.data]
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <FlatList
                data={media}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChatMediaCard message={item} />}
                refreshing={mediaQuery.isRefetching}
                onRefresh={() => void mediaQuery.refetch()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={(
                    <View>
                        <Text style={[styles.intro, { color: colors.secondaryTextColor }]}>
                            Cloudinary sigue siendo la fuente oficial. Los archivos locales se usan como caché o como copias guardadas por ti.
                        </Text>
                        <FlatList
                            horizontal
                            data={filters}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filters}
                            renderItem={({ item }) => {
                                const selected = item.id === filter;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.filterButton,
                                            {
                                                backgroundColor: selected
                                                    ? colors.primaryColor
                                                    : colors.cardColor,
                                                borderColor: colors.borderColor
                                            }
                                        ]}
                                        onPress={() => setFilter(item.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterText,
                                                {
                                                    color: selected
                                                        ? colors.buttonTextColor
                                                        : colors.textColor
                                                }
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}
                ListEmptyComponent={mediaQuery.isLoading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator color={colors.primaryColor} />
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                            Cargando multimedia...
                        </Text>
                    </View>
                ) : mediaQuery.isError ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cloud-offline-outline" size={42} color={colors.secondaryTextColor} />
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                            No fue posible cargar la multimedia. Los archivos previamente guardados siguen disponibles desde sus mensajes.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={42} color={colors.secondaryTextColor} />
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                            No hay archivos en esta categoría.
                        </Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 36 },
    intro: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
    filters: { paddingBottom: 14 },
    filterButton: {
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8
    },
    filterText: { fontSize: 13, fontWeight: '700' },
    card: {
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden'
    },
    cardMain: {
        minHeight: 88,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12
    },
    preview: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    previewImage: { width: '100%', height: '100%' },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)'
    },
    cardText: { flex: 1, marginHorizontal: 12 },
    filename: { fontSize: 15, fontWeight: '800' },
    metadata: { fontSize: 11, marginTop: 4 },
    moreRow: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    moreText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },
    emptyContainer: {
        minHeight: 260,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28
    },
    emptyText: { marginTop: 12, textAlign: 'center', lineHeight: 20 }
});
