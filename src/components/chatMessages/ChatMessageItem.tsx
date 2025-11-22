import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import type { ChatMessage } from '../../types/chat';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useChatStore } from '../../store/useChatStore';

interface Props {
    message: ChatMessage;
}

export const ChatMessageItem = ({ message }: Props) => {
    const { user } = useAuthStore();
    const { setReplyingTo } = useChatStore();

    // Check if I am the author
    const isMe = user?.username === message.author.username;
    
    // Extract text from the JSONB content
    const textContent = getPreviewFromRichText(message.content);
    
    // Format time
    const time = new Date(message.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit' 
    });

    // Author Photo (with fallback)
    const authorPhoto = message.author.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

    const handleLongPress = () => {
        setReplyingTo(message);
    };

    return (
        <View style={[
            styles.container, 
            isMe ? styles.containerRight : styles.containerLeft
        ]}>
            {/* Show Avatar only if it's NOT me */}
            {!isMe && (
                <View style={styles.letterView}>
                    <Image
                        source={{ uri: authorPhoto }}
                        style={styles.avatar}
                    />
                </View>
            )}

            <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={handleLongPress}
                style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}
            >
                {/* --- QUOTED MESSAGE BLOCK --- */}
                {message.replyTo && (
                    <View style={styles.quoteBlock}>
                        <View style={styles.quoteLine} />
                        <View style={{flex: 1}}>
                            <Text style={styles.quoteAuthor}>{message.replyTo.username}</Text>
                            <Text numberOfLines={1} style={styles.quoteText}>
                                {message.replyTo.textPreview}
                            </Text>
                        </View>
                    </View>
                )}
                {/* ---------------------------- */}

                {/* Message Content */}
                <View>
                    {/* Author Name (Only for others, and only if NOT replying to simplify UI) */}
                    {!isMe && !message.replyTo && (
                        <Text style={styles.autor}>
                            {message.author.name.split(' ')[0]}
                        </Text>
                    )}
                    
                    <Text style={[
                        styles.mensajeText, 
                        isMe ? styles.textRight : styles.textLeft
                    ]}>
                        {textContent}
                    </Text>
                    
                    <Text style={[
                        styles.time, 
                        isMe ? styles.timeRight : styles.timeLeft
                    ]}>
                        {time}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 6,
        marginHorizontal: 10,
        alignItems: 'flex-end',
    },
    containerRight: {
        justifyContent: 'flex-end',
    },
    containerLeft: {
        justifyContent: 'flex-start',
    },
    letterView: {
        marginRight: 8,
    },
    avatar: {
        height: 35,
        width: 35,
        borderRadius: 17.5,
        borderWidth: 1,
        borderColor: '#fff'
    },
    bubble: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 20,
        maxWidth: '75%',
        minWidth: '20%',
    },
    bubbleRight: {
        backgroundColor: '#fff',
        borderBottomRightRadius: 4,
    },
    bubbleLeft: {
        backgroundColor: '#AC75FF',
        borderBottomLeftRadius: 4,
    },
    autor: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 4,
        opacity: 0.9
    },
    mensajeText: {
        fontSize: 16,
        lineHeight: 22,
    },
    textRight: {
        color: '#333',
    },
    textLeft: {
        color: '#fff',
    },
    time: {
        fontSize: 10,
        position: 'absolute',
        marginTop: 4,
        bottom: 5,
    },
    timeRight: {
        right: 10,
        color: '#999',
    },
    timeLeft: {
        right: 10,
        color: 'rgba(255,255,255,0.7)',
    },
    // Quote Styles
    quoteBlock: {
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background
        borderRadius: 5,
        padding: 5,
        flexDirection: 'row',
        minWidth: 120
    },
    quoteLine: {
        width: 3,
        backgroundColor: '#888',
        marginRight: 8,
        borderRadius: 2
    },
    quoteAuthor: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#555', // Always dark text for readability in quote
        marginBottom: 2
    },
    quoteText: {
        fontSize: 11,
        color: '#666'
    }
});