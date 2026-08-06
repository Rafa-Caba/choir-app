// src/components/chatMessages/MessageContent.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMediaResource } from '../../hooks/useMediaResource';
import { formatMediaBytes } from '../../storage/mediaStorage';
import type { ChatMessage } from '../../types/chat';
import type { MediaKind } from '../../types/mediaStorage';
import type { Theme } from '../../types/theme';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { RichTextViewer } from '../common/RichTextViewer';
import { MediaActionsModal } from '../shared/MediaActionsModal';
import { MediaViewerModal } from '../shared/MediaViewerModal';

interface MessageContentProps {
    readonly message: ChatMessage;
    readonly isMe: boolean;
    readonly colors: Theme;
    readonly textColor: string;
    readonly timeColor: string;
}

const formatDuration = (durationMillis: number): string => {
    const totalSeconds = Math.max(0, Math.floor(durationMillis / 1_000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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

export const MessageContent = ({
    message,
    isMe,
    colors,
    textColor,
    timeColor
}: MessageContentProps) => {
    const [viewerVisible, setViewerVisible] = useState(false);
    const [actionsVisible, setActionsVisible] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioPositionMillis, setAudioPositionMillis] = useState(0);
    const [audioDurationMillis, setAudioDurationMillis] = useState(0);
    const mediaKind = getMediaKind(message);
    const mediaUrl = message.cachedMediaUrl ||
        message.media?.url ||
        message.fileUrl ||
        message.imageUrl ||
        message.audioUrl ||
        '';
    const filename = message.media?.filename || message.filename || 'Archivo adjunto';
    const mimeType = message.media?.mimeType || getDefaultMimeType(mediaKind);
    const mediaBytes = message.media?.bytes ?? 0;
    const resource = useMediaResource({
        remoteUrl: mediaUrl,
        filename,
        mimeType,
        kind: mediaKind,
        category: 'chat'
    });
    const isVideo = mediaKind === 'VIDEO';
    const isAudio = mediaKind === 'AUDIO';
    const isImage = mediaKind === 'IMAGE';
    const isFile = mediaKind === 'DOCUMENT';
    const isSticker = message.type === 'STICKER';
    const textContent = getPreviewFromRichText(message.content);
    const shouldRenderText = Boolean(textContent.trim());
    const waveformBars = useMemo(
        () => Array.from({ length: 24 }, (_value, index) => 7 + ((index * 9 + 5) % 20)),
        []
    );
    const audioProgress = audioDurationMillis > 0
        ? Math.min(1, audioPositionMillis / audioDurationMillis)
        : 0;
    const statusText = resource.record
        ? resource.record.location === 'DOCUMENTS'
            ? 'Guardado en el dispositivo'
            : 'Disponible sin conexión'
        : resource.state === 'DOWNLOADING'
            ? `Descargando ${Math.round((resource.progress?.fraction ?? 0) * 100)}%`
            : 'Toca para ver opciones';

    useEffect(() => {
        return () => {
            if (sound) {
                void sound.unloadAsync();
            }
        };
    }, [sound]);

    const playSound = async (): Promise<void> => {
        if (!mediaUrl) {
            return;
        }

        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            setIsLoadingAudio(true);
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const created = await Audio.Sound.createAsync(
                { uri: resource.displayUri },
                { shouldPlay: true },
                (status) => {
                    if (!status.isLoaded) {
                        return;
                    }

                    setAudioPositionMillis(status.positionMillis);
                    setAudioDurationMillis(status.durationMillis ?? 0);
                    setIsPlaying(status.isPlaying);

                    if (status.didJustFinish) {
                        setAudioPositionMillis(0);
                        setIsPlaying(false);
                    }
                }
            );
            setSound(created.sound);
            setIsPlaying(true);
        } catch {
            setIsPlaying(false);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    if (isSticker) {
        return (
            <View style={styles.stickerContainer}>
                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}>
                        {message.author.name}
                    </Text>
                )}
                <Text style={styles.sticker}>{textContent || '✨'}</Text>
            </View>
        );
    }

    if (isAudio) {
        return (
            <View>
                <MediaActionsModal
                    visible={actionsVisible}
                    onClose={() => setActionsVisible(false)}
                    remoteUrl={mediaUrl}
                    filename={filename}
                    mimeType={mimeType}
                    kind="AUDIO"
                    category="chat"
                    initialBytes={mediaBytes}
                />

                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}>
                        {message.author.name}
                    </Text>
                )}
                <View style={styles.audioContainer}>
                    <TouchableOpacity
                        onPress={() => void playSound()}
                        disabled={isLoadingAudio}
                        style={styles.audioPlayButton}
                        accessibilityLabel={isPlaying ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
                    >
                        {isLoadingAudio ? (
                            <ActivityIndicator color={textColor} size="small" />
                        ) : (
                            <Ionicons
                                name={isPlaying ? 'pause' : 'play'}
                                size={28}
                                color={textColor}
                            />
                        )}
                    </TouchableOpacity>
                    <View style={styles.audioWaveformContainer}>
                        <View style={styles.audioWaveform}>
                            {waveformBars.map((height, index) => {
                                const completed = index / waveformBars.length <= audioProgress;
                                return (
                                    <View
                                        key={`${index}-${height}`}
                                        style={[
                                            styles.audioWaveformBar,
                                            {
                                                height,
                                                backgroundColor: completed ? textColor : timeColor
                                            }
                                        ]}
                                    />
                                );
                            })}
                        </View>
                        <Text style={[styles.audioDuration, { color: timeColor }]}>
                            {formatDuration(audioDurationMillis || audioPositionMillis)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => setActionsVisible(true)}
                        accessibilityLabel="Abrir acciones de la nota de voz"
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (isImage || isVideo) {
        return (
            <View>
                <MediaViewerModal
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    mediaUrl={mediaUrl}
                    mediaType={isVideo ? 'video' : 'image'}
                    filename={filename}
                    mimeType={mimeType}
                    category="chat"
                    initialBytes={mediaBytes}
                />

                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}>
                        {message.author.name || 'Usuario'}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={() => setViewerVisible(true)}
                    style={styles.mediaPreview}
                    activeOpacity={0.9}
                >
                    {isVideo ? (
                        <Video
                            source={{ uri: resource.displayUri }}
                            style={styles.imagePreview}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            isMuted
                        />
                    ) : (
                        <Image
                            source={{ uri: resource.displayUri }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                        />
                    )}
                    {isVideo && (
                        <View style={styles.videoOverlay}>
                            <Ionicons
                                name="play-circle"
                                size={40}
                                color="rgba(255,255,255,0.9)"
                            />
                        </View>
                    )}
                    {resource.state === 'DOWNLOADING' && (
                        <View style={styles.videoOverlay}>
                            <ActivityIndicator color="#ffffff" />
                        </View>
                    )}
                </TouchableOpacity>
                {shouldRenderText && (
                    <View style={styles.mediaText}>
                        <RichTextViewer content={message.content} tight />
                    </View>
                )}
            </View>
        );
    }

    if (isFile) {
        return (
            <View>
                <MediaActionsModal
                    visible={actionsVisible}
                    onClose={() => setActionsVisible(false)}
                    remoteUrl={mediaUrl}
                    filename={filename}
                    mimeType={mimeType}
                    kind="DOCUMENT"
                    category="chat"
                    initialBytes={mediaBytes}
                />

                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}>
                        {message.author.name}
                    </Text>
                )}
                <TouchableOpacity
                    onPress={() => setActionsVisible(true)}
                    style={styles.mediaContainer}
                >
                    <View
                        style={[
                            styles.fileIcon,
                            {
                                backgroundColor: isMe
                                    ? 'rgba(255,255,255,0.2)'
                                    : colors.backgroundColor
                            }
                        ]}
                    >
                        <Ionicons
                            name="document-text"
                            size={24}
                            color={isMe ? colors.buttonTextColor : colors.primaryColor}
                        />
                    </View>
                    <View style={styles.flexOne}>
                        <Text
                            numberOfLines={1}
                            style={[styles.messageText, { color: textColor, fontWeight: 'bold' }]}
                        >
                            {filename}
                        </Text>
                        <Text style={[styles.downloadText, { color: timeColor }]}>
                            {formatMediaBytes(resource.record?.bytes ?? mediaBytes)} · {statusText}
                        </Text>
                    </View>
                    <Ionicons name="ellipsis-vertical" size={20} color={textColor} />
                </TouchableOpacity>
                {shouldRenderText && (
                    <Text style={[styles.messageText, { color: textColor, marginTop: 5 }]}>
                        {textContent}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View>
            {!isMe && (
                <Text style={[styles.author, { color: colors.primaryColor }]}>
                    {message.author.name}
                </Text>
            )}
            <Text style={[styles.messageText, { color: textColor }]}>
                {textContent || 'Mensaje vacío'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    author: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    messageText: { fontSize: 16, lineHeight: 22 },
    mediaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        minWidth: 190
    },
    mediaPreview: {
        width: 200,
        height: 200,
        borderRadius: 10,
        marginTop: 5,
        overflow: 'hidden',
        position: 'relative'
    },
    imagePreview: { width: '100%', height: '100%', backgroundColor: '#000000' },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    fileIcon: { padding: 8, borderRadius: 8, marginRight: 10 },
    downloadText: { fontSize: 10, marginTop: 2 },
    mediaText: { marginTop: 12 },
    stickerContainer: { alignItems: 'center' },
    sticker: { fontSize: 58, lineHeight: 68 },
    audioContainer: {
        minWidth: 215,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4
    },
    audioPlayButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
    },
    audioWaveformContainer: { flex: 1, marginLeft: 6 },
    audioWaveform: {
        height: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    audioWaveformBar: { width: 2, borderRadius: 1, opacity: 0.9 },
    audioDuration: { fontSize: 10, marginTop: 1 },
    moreButton: {
        width: 30,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
