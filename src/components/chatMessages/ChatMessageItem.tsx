import React, { useState } from 'react';
import {
    Image, StyleSheet, Text, TouchableOpacity, View, Alert
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import type { ChatMessage } from '../../types/chat';
import { useChatStore } from '../../store/useChatStore';
import { useTheme } from '../../context/ThemeContext';
import { MessageContent } from './MessageContent';
import { MediaViewerModal } from '../shared/MediaViewerModal';
import { Ionicons } from '@expo/vector-icons'; // Import for reaction icon

interface Props {
    message: ChatMessage;
}

export const ChatMessageItem = ({ message }: Props) => {
    const { user } = useAuthStore();
    const { setReplyingTo, reactToMessage } = useChatStore(); // 🆕 Get reactToMessage
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const myId = user?.id?.toString() || '';
    let authorId = '';

    if (message.author?.id) {
        authorId = message.author.id.toString();
    }

    if (!authorId && message.author) {
        const rawAutor = message.author as any;
        if (typeof rawAutor === 'object') {
            authorId = (rawAutor.id || rawAutor._id || '').toString();
        } else if (typeof rawAutor === 'string') {
            authorId = rawAutor;
        }
    }

    const isMe = myId !== '' && authorId !== '' && myId === authorId;

    const authorName = message.author?.name ? message.author.name.split(' ')[0] : 'User';
    const authorPhoto = message.author?.imageUrl || `https://ui-avatars.com/api/?name=${authorName}`;
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubbleStyle = isMe
        ? { backgroundColor: colors.primaryColor, borderBottomRightRadius: 4 }
        : { backgroundColor: colors.cardColor, borderBottomLeftRadius: 4 };

    const textColor = isMe ? colors.buttonTextColor : colors.textColor;
    const timeColor = isMe ? 'rgba(255,255,255,0.7)' : colors.secondaryTextColor;

    const handleLongPress = () => {
        Alert.alert(
            "Message Options",
            "Choose an action",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reply",
                    onPress: () => setReplyingTo(message)
                },
                {
                    text: "React ❤️",
                    onPress: () => reactToMessage(message.id.toString(), '❤️')
                }
            ]
        );
    };

    console.log({ text: message });


    return (
        <View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft]}>

            <MediaViewerModal
                visible={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                mediaUrl={authorPhoto}
                mediaType="image"
            />

            {!isMe && (
                <View style={styles.letterView}>
                    <TouchableOpacity onPress={() => setShowAvatarModal(true)} activeOpacity={0.8}>
                        <Image source={{ uri: authorPhoto }} style={styles.avatar} />
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={handleLongPress}
                style={[styles.bubble, bubbleStyle]}
            >
                {message.replyTo && typeof message.replyTo !== 'string' && (
                    <View style={[styles.quoteBlock, { backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.quoteLine, { backgroundColor: isMe ? 'white' : colors.primaryColor }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.quoteAuthor, { color: isMe ? 'white' : colors.primaryColor }]}>
                                {message.replyTo.username}
                            </Text>
                            <Text numberOfLines={2} style={[styles.quoteText, { color: isMe ? '#fff' : 'white' }]}>
                                {message.replyTo.textPreview}
                            </Text>
                        </View>
                    </View>
                )}

                <MessageContent
                    message={message}
                    isMe={isMe}
                    colors={colors}
                    textColor={textColor}
                    timeColor={timeColor}
                />

                <Text style={[styles.time, { color: timeColor, right: isMe ? 10 : 10 }]}>
                    {time}
                </Text>

                {message.reactions && message.reactions.length > 0 && (
                    <View style={[
                        styles.reactionsContainer,
                        { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }
                    ]}>
                        {/* Group and count reactions or show list */}
                        {message.reactions.map((r, index) => (
                            <Text key={index} style={{ fontSize: 10 }}>{r.emoji}</Text>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', marginVertical: 6, marginHorizontal: 10, alignItems: 'flex-end' },
    containerRight: { justifyContent: 'flex-end' },
    containerLeft: { justifyContent: 'flex-start' },
    letterView: { marginRight: 8 },
    avatar: { height: 35, width: 35, borderRadius: 17.5, backgroundColor: '#ccc' },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 22, maxWidth: '75%', minWidth: '20%' },
    time: { fontSize: 10, position: 'absolute', bottom: 4 },
    quoteBlock: { marginBottom: 8, borderRadius: 5, padding: 5, flexDirection: 'row', minWidth: 120 },
    quoteLine: { width: 3, marginRight: 8, borderRadius: 2 },
    quoteAuthor: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
    quoteText: { fontSize: 11 },

    reactionsContainer: {
        position: 'absolute',
        bottom: -10,
        right: 10,
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2
    }
});