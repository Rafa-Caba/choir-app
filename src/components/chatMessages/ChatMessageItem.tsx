import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import type { ChatMessage } from '../../types/chat';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useChatStore } from '../../store/useChatStore';
import { useTheme } from '../../context/ThemeContext';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    message: ChatMessage;
}

export const ChatMessageItem = ({ message }: Props) => {
    const { user } = useAuthStore();
    const { setReplyingTo } = useChatStore();
    const { currentTheme } = useTheme(); 
    const colors = currentTheme.colors;

    const isMe = user?.username === message.author.username;
    
    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // --- THE CLEANUP EFFECT ---
    useEffect(() => {
        return () => {
            if (sound) {
                // Stop and unload from memory when component dies
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const playSound = async () => {
        if (!message.audioUrl) return;
        
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
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: message.audioUrl },
                    { shouldPlay: true }
                );
                
                setSound(newSound);
                setIsPlaying(true);

                // Reset when audio finishes
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        newSound.setPositionAsync(0);
                    }
                });
            }
        } catch (error) {
            console.log("Error playing audio", error);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const handleLongPress = () => {
        setReplyingTo(message);
    };

    const textContent = getPreviewFromRichText(message.content);
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const authorPhoto = message.author.imageUrl || 'https://via.placeholder.com/100';

    // Dynamic Styles
    const bubbleStyle = isMe 
        ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } 
        : { backgroundColor: colors.card, borderBottomLeftRadius: 4 };

    const textColor = isMe ? colors.buttonText : colors.text;
    const timeColor = !isMe ? 'rgba(255,255,255,0.9)' : colors.textSecondary;

    return (
        <View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft]}>
            {!isMe && (
                <View style={styles.letterView}>
                    <Image source={{ uri: authorPhoto }} style={styles.avatar} />
                </View>
            )}

            <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={handleLongPress}
                style={[styles.bubble, bubbleStyle]}
            >
                {/* Quote Block */}
                {message.replyTo && (
                    <View style={[styles.quoteBlock, { backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.quoteLine, { backgroundColor: isMe ? 'white' : colors.primary }]} />
                        <View style={{flex: 1}}>
                            <Text style={[styles.quoteAuthor, { color: isMe ? 'white' : colors.primary }]}>{message.replyTo.username}</Text>
                            <Text numberOfLines={1} style={[styles.quoteText, { color: isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>{message.replyTo.textPreview}</Text>
                        </View>
                    </View>
                )}

                {/* Content Render */}
                {message.type === 'AUDIO' ? (
                    <View style={styles.audioContainer}>
                         <TouchableOpacity onPress={playSound} disabled={isLoadingAudio}>
                            {isLoadingAudio ? (
                                <ActivityIndicator color={textColor} size="small" />
                            ) : (
                                <Ionicons 
                                    name={isPlaying ? "pause" : "play"} 
                                    size={30} 
                                    color={textColor} 
                                />
                            )}
                        </TouchableOpacity>
                        <Text style={{ color: textColor, marginLeft: 10, fontWeight: '500' }}>
                            Nota de Voz
                        </Text>
                    </View>
                ) : (
                    <View>
                        {!isMe && !message.replyTo && (
                            <Text style={[styles.autor, { color: colors.primary }]}>{message.author.name.split(' ')[0]}</Text>
                        )}
                        <Text style={[styles.mensajeText, { color: textColor }]}>{textContent}</Text>
                    </View>
                )}
                
                <Text style={[styles.time, { color: timeColor, right: isMe ? 0 : undefined, left: !isMe ? 0 : undefined }]}>
                    {time}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', marginVertical: 6, marginHorizontal: 10, alignItems: 'flex-end' },
    containerRight: { justifyContent: 'flex-end' },
    containerLeft: { justifyContent: 'flex-start' },
    letterView: { marginRight: 8 },
    avatar: { height: 35, width: 35, borderRadius: 17.5 },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20, maxWidth: '75%', minWidth: '20%' },
    autor: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    mensajeText: { fontSize: 16, lineHeight: 22 },
    time: { fontSize: 10, position: 'absolute', bottom: -13 }, // Fixed negative bottom to show time below content
    quoteBlock: { marginBottom: 8, borderRadius: 5, padding: 5, flexDirection: 'row', minWidth: 120 },
    quoteLine: { width: 3, marginRight: 8, borderRadius: 2 },
    quoteAuthor: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
    quoteText: { fontSize: 11 },
    audioContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, minWidth: 150 }
});