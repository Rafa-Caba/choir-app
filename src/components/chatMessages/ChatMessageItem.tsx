// src/components/chatMessages/ChatMessageItem.tsx

import React, { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import type { ChatMessage, MessageReaction } from '../../types/chat';
import { useChatStore } from '../../store/useChatStore';
import { useTheme } from '../../context/ThemeContext';
import { MessageContent } from './MessageContent';
import { MediaViewerModal } from '../shared/MediaViewerModal';

interface Props {
    readonly message: ChatMessage;
    readonly highlighted?: boolean;
    readonly onReplyPress?: (messageId: string) => void;
}

const getReactionKey = (reaction: MessageReaction, index: number): string => {
    const userId = typeof reaction.user === 'string'
        ? reaction.user
        : reaction.user.id;
    return `${reaction.emoji}:${userId}:${index}`;
};

export const ChatMessageItem = ({
    message,
    highlighted = false,
    onReplyPress
}: Props) => {
    const user = useAuthStore((state) => state.user);
    const setReplyingTo = useChatStore((state) => state.setReplyingTo);
    const reactToMessage = useChatStore((state) => state.reactToMessage);
    const colors = useTheme().currentTheme;
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const myId = user?.id ?? '';
    const authorId = message.author.id;
    const isMe = Boolean(myId && authorId && myId === authorId);
    const isSticker = message.type === 'STICKER';
    const authorName = message.author.name.split(' ')[0] || 'Usuario';
    const authorPhoto = message.author.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;
    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const deliveredToOthers = message.deliveredTo.some((userId) => userId !== myId);
    const readByOthers = message.readBy.some((userId) => userId !== myId);
    const receiptIcon = readByOthers || deliveredToOthers
        ? 'checkmark-done'
        : 'checkmark';
    const bubbleBackground = isSticker
        ? 'transparent'
        : isMe
            ? colors.primaryColor
            : colors.cardColor;
    const textColor = isMe ? colors.buttonTextColor : colors.textColor;
    const timeColor = isMe ? 'rgba(255,255,255,0.75)' : colors.secondaryTextColor;
    const receiptColor = readByOthers ? colors.accentColor : timeColor;

    const handleLongPress = (): void => {
        Alert.alert(
            'Opciones del mensaje',
            'Selecciona una acción',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Responder',
                    onPress: () => setReplyingTo(message)
                },
                {
                    text: 'Reaccionar ❤️',
                    onPress: () => {
                        void reactToMessage(message.id, '❤️');
                    }
                }
            ]
        );
    };

    const handleReplyPress = (): void => {
        const replyMessageId = message.replyTo?.id ?? '';

        if (replyMessageId) {
            onReplyPress?.(replyMessageId);
        }
    };

    return (
        <View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft]}>
            <MediaViewerModal
                visible={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                mediaUrl={authorPhoto}
                mediaType="image"
                category="users"
                actionsEnabled={false}
            />

            {!isMe && (
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={() => setShowAvatarModal(true)} activeOpacity={0.8}>
                        <Image source={{ uri: authorPhoto }} style={styles.avatar} />
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={handleLongPress}
                style={[
                    styles.bubble,
                    isSticker ? styles.stickerBubble : undefined,
                    highlighted
                        ? {
                            borderColor: colors.accentColor,
                            borderWidth: 2,
                            shadowColor: colors.accentColor,
                            shadowOpacity: 0.35,
                            shadowRadius: 8,
                            elevation: 5
                        }
                        : undefined,
                    {
                        backgroundColor: bubbleBackground,
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: isMe ? 16 : 4
                    }
                ]}
            >
                {message.replyTo && (
                    <TouchableOpacity
                        activeOpacity={message.replyTo.id ? 0.75 : 1}
                        disabled={!message.replyTo.id || !onReplyPress}
                        onPress={handleReplyPress}
                        accessibilityRole="button"
                        accessibilityLabel="Ir al mensaje original"
                        style={[
                            styles.quoteBlock,
                            {
                                backgroundColor: isMe
                                    ? 'rgba(0,0,0,0.12)'
                                    : colors.backgroundColor
                            }
                        ]}
                    >
                        <View
                            style={[
                                styles.quoteLine,
                                { backgroundColor: isMe ? colors.buttonTextColor : colors.primaryColor }
                            ]}
                        />
                        <View style={styles.flexOne}>
                            <Text
                                style={[
                                    styles.quoteAuthor,
                                    { color: isMe ? colors.buttonTextColor : colors.primaryColor }
                                ]}
                            >
                                {message.replyTo.authorName || message.replyTo.username}
                            </Text>
                            <Text
                                numberOfLines={2}
                                style={[
                                    styles.quoteText,
                                    { color: isMe ? colors.buttonTextColor : colors.textColor }
                                ]}
                            >
                                {message.replyTo.textPreview}
                            </Text>
                        </View>
                        {message.replyTo.id ? (
                            <Ionicons
                                name="arrow-up"
                                size={14}
                                color={isMe ? colors.buttonTextColor : colors.primaryColor}
                                style={styles.quoteJumpIcon}
                            />
                        ) : null}
                    </TouchableOpacity>
                )}

                <MessageContent
                    message={message}
                    isMe={isMe}
                    colors={colors}
                    textColor={textColor}
                    timeColor={timeColor}
                />

                <View
                    style={[
                        styles.footer,
                        isSticker
                            ? {
                                backgroundColor: colors.cardColor,
                                borderColor: colors.borderColor,
                                borderWidth: 1
                            }
                            : undefined
                    ]}
                >
                    <Text
                        style={[
                            styles.time,
                            { color: isSticker ? colors.secondaryTextColor : timeColor }
                        ]}
                    >
                        {time}
                    </Text>
                    {isMe && (
                        <Ionicons
                            name={receiptIcon}
                            size={16}
                            color={receiptColor}
                            style={styles.receiptIcon}
                            accessibilityLabel={readByOthers
                                ? 'Mensaje visto'
                                : deliveredToOthers
                                    ? 'Mensaje entregado'
                                    : 'Mensaje enviado'}
                        />
                    )}
                </View>

                {message.reactions.length > 0 && (
                    <View
                        style={[
                            styles.reactionsContainer,
                            {
                                backgroundColor: colors.backgroundColor,
                                borderColor: colors.borderColor
                            }
                        ]}
                    >
                        {message.reactions.map((reaction, index) => (
                            <Text key={getReactionKey(reaction, index)} style={styles.reactionText}>
                                {reaction.emoji}
                            </Text>
                        ))}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: {
        flexDirection: 'row',
        marginVertical: 6,
        marginHorizontal: 10,
        alignItems: 'flex-end'
    },
    containerRight: { justifyContent: 'flex-end' },
    containerLeft: { justifyContent: 'flex-start' },
    avatarContainer: { marginRight: 8 },
    avatar: { height: 35, width: 35, borderRadius: 17.5, backgroundColor: '#cccccc' },
    bubble: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
        maxWidth: '78%',
        minWidth: '20%'
    },
    stickerBubble: {
        paddingHorizontal: 4,
        paddingTop: 2,
        paddingBottom: 2,
        minWidth: 70,
        maxWidth: '46%'
    },
    footer: {
        minHeight: 18,
        marginTop: 3,
        paddingHorizontal: 4,
        borderRadius: 9,
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center'
    },
    time: { fontSize: 10 },
    receiptIcon: { marginLeft: 3 },
    quoteBlock: {
        marginBottom: 8,
        borderRadius: 8,
        padding: 7,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 120
    },
    quoteLine: { width: 3, alignSelf: 'stretch', marginRight: 8, borderRadius: 2 },
    quoteAuthor: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
    quoteText: { fontSize: 11 },
    quoteJumpIcon: { marginLeft: 6 },
    reactionsContainer: {
        position: 'absolute',
        bottom: -12,
        right: 10,
        flexDirection: 'row',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2
    },
    reactionText: { fontSize: 11 }
});
