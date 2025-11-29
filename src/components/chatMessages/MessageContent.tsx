import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import type { ChatMessage } from '../../types/chat';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { MediaViewerModal } from '../shared/MediaViewerModal';

interface MessageContentProps {
    message: ChatMessage;
    isMe: boolean;
    colors: any;
    textColor: string;
    timeColor: string;
}

export const MessageContent = ({ message, isMe, colors, textColor, timeColor }: MessageContentProps) => {
    const [isModalVisible, setModalVisible] = useState(false);

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // 1. Extract Data (English)
    // The backend refactor standardized 'fileUrl' to hold the URL for everything.
    // But 'imageUrl' / 'audioUrl' aliases exist in toJSON for convenience.
    const mediaUrl = message.fileUrl || message.imageUrl || message.audioUrl || '';
    const filename = message.filename || 'Attachment';
    const type = message.type || 'TEXT';

    const isVideo = type === 'VIDEO';
    const isAudio = type === 'AUDIO';
    const isImage = type === 'IMAGE';
    const isFile = type === 'FILE';

    const textContent = getPreviewFromRichText(message.content);
    const shouldRenderText = !!(textContent && textContent.trim() !== '');

    // 3. Audio Logic
    useEffect(() => {
        return () => { if (sound) sound.unloadAsync(); };
    }, [sound]);

    const playSound = async () => {
        if (!mediaUrl) return;
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                setIsLoadingAudio(true);
                await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
                const { sound: newSound } = await Audio.Sound.createAsync({ uri: mediaUrl }, { shouldPlay: true });
                setSound(newSound);
                setIsPlaying(true);
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        newSound.setPositionAsync(0);
                    }
                });
            }
        } catch (error) { console.log("Audio Error", error); }
        finally { setIsLoadingAudio(false); }
    };

    const handleFilePress = () => {
        if (isImage || isVideo) setModalVisible(true);
        else if (mediaUrl) Linking.openURL(mediaUrl);
    };

    // --- Renderers ---

    if (isAudio) {
        return (
            <View style={styles.mediaContainer}>
                <TouchableOpacity onPress={playSound} disabled={isLoadingAudio}>
                    {isLoadingAudio ? (
                        <ActivityIndicator color={textColor} size="small" />
                    ) : (
                        <Ionicons name={isPlaying ? "pause" : "play"} size={30} color={textColor} />
                    )}
                </TouchableOpacity>
                <Text style={{ color: textColor, marginLeft: 10, fontWeight: '500' }}>Voice Note</Text>
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

                {!isMe && <Text style={[styles.autor, { color: colors.primaryColor }]}>{message.author?.name || 'User'}</Text>}

                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.mediaPreview} activeOpacity={0.9}>
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
                {shouldRenderText && <Text style={[styles.mensajeText, { color: textColor, marginTop: 5 }]}>{textContent}</Text>}
            </View>
        );
    }

    if (isFile) {
        return (
            <View>
                {!isMe && <Text style={[styles.autor, { color: colors.primaryColor }]}>{message.author?.name}</Text>}
                <TouchableOpacity onPress={handleFilePress} style={styles.mediaContainer}>
                    <View style={[styles.fileIcon, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.backgroundColor }]}>
                        <Ionicons name="document-text" size={24} color={isMe ? 'white' : colors.primaryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.mensajeText, { color: textColor, fontWeight: 'bold' }]}>{filename}</Text>
                        <Text style={{ color: timeColor, fontSize: 10 }}>Tap to download</Text>
                    </View>
                </TouchableOpacity>
                {shouldRenderText && <Text style={[styles.mensajeText, { color: textColor, marginTop: 5 }]}>{textContent}</Text>}
            </View>
        );
    }

    return (
        <View>
            {!isMe && <Text style={[styles.autor, { color: colors.primaryColor }]}>{message.author?.name}</Text>}
            <Text style={[styles.mensajeText, { color: textColor }]}>{textContent || 'Empty message'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    autor: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    mensajeText: { fontSize: 16, lineHeight: 22 },
    mediaContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, minWidth: 150 },
    mediaPreview: { width: 200, height: 200, borderRadius: 10, marginTop: 5, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', backgroundColor: '#000' },
    videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
    fileIcon: { padding: 8, borderRadius: 8, marginRight: 10 },
});