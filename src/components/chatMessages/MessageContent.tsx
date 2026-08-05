// src/components/chatMessages/MessageContent.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessage } from '../../types/chat';
import type { Theme } from '../../types/theme';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { MediaViewerModal } from '../shared/MediaViewerModal';
import { RichTextViewer } from '../common/RichTextViewer';

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

export const MessageContent = ({
    message,
    isMe,
    colors,
    textColor,
    timeColor
}: MessageContentProps) => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioPositionMillis, setAudioPositionMillis] = useState(0);
    const [audioDurationMillis, setAudioDurationMillis] = useState(0);

    const mediaUrl = message.cachedMediaUrl || message.fileUrl || message.imageUrl || message.audioUrl || '';
    const filename = message.filename || 'Archivo adjunto';
    const type = message.type;
    const isVideo = type === 'VIDEO';
    const isAudio = type === 'AUDIO';
    const isImage = type === 'IMAGE';
    const isFile = type === 'FILE';
    const isSticker = type === 'STICKER';
    const textContent = getPreviewFromRichText(message.content);
    const shouldRenderText = Boolean(textContent.trim());
    const waveformBars = useMemo(
        () => Array.from({ length: 24 }, (_value, index) => 7 + ((index * 9 + 5) % 20)),
        []
    );
    const audioProgress = audioDurationMillis > 0
        ? Math.min(1, audioPositionMillis / audioDurationMillis)
        : 0;

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
                { uri: mediaUrl },
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

    const handleFilePress = (): void => {
        if (isImage || isVideo) {
            setModalVisible(true);
            return;
        }

        if (mediaUrl) {
            void Linking.openURL(mediaUrl);
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
                            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={textColor} />
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
                </View>
            </View>
        );
    }

    if (isImage || isVideo) {
        return (
            <View>
                <MediaViewerModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    mediaUrl={mediaUrl}
                    mediaType={isVideo ? 'video' : 'image'}
                />

                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}> 
                        {message.author.name || 'Usuario'}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={styles.mediaPreview}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: isVideo ? mediaUrl.replace(/\.(mp4|mov|webm)$/i, '.jpg') : mediaUrl }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                    />
                    {isVideo && (
                        <View style={styles.videoOverlay}>
                            <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
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
                {!isMe && (
                    <Text style={[styles.author, { color: colors.primaryColor }]}> 
                        {message.author.name}
                    </Text>
                )}
                <TouchableOpacity onPress={handleFilePress} style={styles.mediaContainer}>
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
                        <Text style={[styles.downloadText, { color: timeColor }]}>Toca para descargar</Text>
                    </View>
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
    mediaContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, minWidth: 150 },
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
    downloadText: { fontSize: 10 },
    mediaText: { marginTop: 12 },
    stickerContainer: { alignItems: 'center' },
    sticker: { fontSize: 58, lineHeight: 68 },
    audioContainer: {
        minWidth: 205,
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
    audioDuration: { fontSize: 10, marginTop: 1 }
});
