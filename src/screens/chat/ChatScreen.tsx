import React, { useEffect, useRef, useState } from 'react';
import {
    View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text,
    ActivityIndicator, TouchableOpacity, Modal, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessageItem } from '../../components/chatMessages/ChatMessageItem';
import { ChatInput } from '../../components/chatMessages/ChatInput';

export const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const {
        messages, sendMessage, loadHistory, fetchDirectory,
        connected, loading, onlineUsers, allUsers, typingUsers, sendTyping
    } = useChatStore();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    // UI State
    const [showOnlineModal, setShowOnlineModal] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadHistory();
        fetchDirectory();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages.length]);

    const sortedUsers = React.useMemo(() => {
        const list = allUsers.map(u => ({
            ...u,
            isOnline: onlineUsers.some(online => online.id === u.id)
        }));

        // Sort: Online first, then Alphabetical
        return list.sort((a, b) => {
            if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
            return a.isOnline ? -1 : 1;
        });
    }, [allUsers, onlineUsers]);

    const handleSend = (text: string, attachment?: { uri: string, type: 'image' | 'video' | 'audio' | 'file' }) => {
        sendMessage(text, attachment);
    };

    // ⌨️ Handle Typing Logic
    const handleTyping = () => {
        sendTyping(true);

        // Clear existing timeout to keep "is typing" active while user types
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(false);
        }, 2000);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>

            {/* --- HEADER (Clickable for Online List) --- */}
            <TouchableOpacity
                style={[styles.header, { backgroundColor: colors.cardColor, borderBottomColor: colors.borderColor || 'transparent' }]}
                activeOpacity={0.7}
                onPress={() => setShowOnlineModal(true)}
            >
                <View>
                    <Text style={[styles.headerTitle, { color: colors.textColor }]}>Chat de Grupo</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.dot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
                        <Text style={[styles.headerSubtitle, { color: colors.secondaryTextColor }]}>
                            {connected ? `${onlineUsers.length} Online` : 'Conectando...'}
                        </Text>
                    </View>
                </View>
                {loading ? (
                    <ActivityIndicator color={colors.primaryColor} />
                ) : (
                    <Ionicons name="people" size={24} color={colors.primaryColor} />
                )}
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                    renderItem={({ item }) => <ChatMessageItem message={item} />}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />

                {/* ⌨️ TYPING INDICATOR */}
                {typingUsers.length > 0 && (
                    <View style={[styles.typingContainer, { backgroundColor: colors.backgroundColor }]}>
                        <Text style={[styles.typingText, { color: colors.secondaryTextColor }]}>
                            {typingUsers.length === 1
                                ? `${typingUsers[0]} is typing...`
                                : `${typingUsers.length} people are typing...`}
                        </Text>
                    </View>
                )}

                <ChatInput onSend={handleSend} onTyping={handleTyping} />
            </KeyboardAvoidingView>

            {/* --- ONLINE USERS MODAL --- */}
            <Modal visible={showOnlineModal} transparent animationType="slide" onRequestClose={() => setShowOnlineModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>Members</Text>
                            <TouchableOpacity onPress={() => setShowOnlineModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textColor} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={sortedUsers}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.userItem, { borderBottomColor: colors.borderColor || '#eee' }]}>
                                    <View style={styles.userAvatar}>
                                        <Image
                                            source={{ uri: item.imageUrl || `https://ui-avatars.com/api/?name=${item.name}` }}
                                            style={[styles.avatarImage, { opacity: item.isOnline ? 1 : 0.5 }]}
                                        />
                                        <View style={[
                                            styles.onlineBadge,
                                            { backgroundColor: item.isOnline ? '#4CAF50' : '#BDBDBD' }
                                        ]} />
                                    </View>
                                    <View>
                                        <Text style={[styles.userName, { color: colors.textColor }]}>{item.name}</Text>
                                        <Text style={{ fontSize: 10, color: colors.secondaryTextColor }}>
                                            {item.isOnline ? 'Online' : 'Offline'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 12, marginLeft: 5 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
    listContent: { paddingBottom: 20 },
    typingContainer: { padding: 5, paddingLeft: 20 },
    typingText: { fontStyle: 'italic', fontSize: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },

    userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    userAvatar: { marginRight: 15 },
    avatarImage: { width: 45, height: 45, borderRadius: 22.5 },
    onlineBadge: {
        width: 12, height: 12, borderRadius: 6,
        position: 'absolute', bottom: 0, right: 0,
        borderWidth: 2, borderColor: 'white'
    },
    userName: { fontSize: 16, fontWeight: '500' }
});