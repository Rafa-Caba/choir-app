// src/screens/chat/ChatScreen.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatInput } from '../../components/chatMessages/ChatInput';
import { ChatMessageItem } from '../../components/chatMessages/ChatMessageItem';
import { useTheme } from '../../context/ThemeContext';
import type { ChatAttachment } from '../../services/chat';
import { useChatStore } from '../../store/useChatStore';
import type { ChatMessage } from '../../types/chat';

export const ChatScreen = () => {
    const flatListRef = useRef<FlatList<ChatMessage>>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const focusScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showOnlineModal, setShowOnlineModal] = useState(false);
    const colors = useTheme().currentTheme;
    const messages = useChatStore((state) => state.messages);
    const connected = useChatStore((state) => state.connected);
    const connectionError = useChatStore((state) => state.connectionError);
    const loading = useChatStore((state) => state.loading);
    const directoryLoading = useChatStore((state) => state.directoryLoading);
    const directoryLoaded = useChatStore((state) => state.directoryLoaded);
    const directoryError = useChatStore((state) => state.directoryError);
    const onlineUsers = useChatStore((state) => state.onlineUsers);
    const allUsers = useChatStore((state) => state.allUsers);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const connect = useChatStore((state) => state.connect);
    const loadHistory = useChatStore((state) => state.loadHistory);
    const fetchDirectory = useChatStore((state) => state.fetchDirectory);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const sendTyping = useChatStore((state) => state.sendTyping);

    useEffect(() => {
        connect();
        loadHistory().catch(() => undefined);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            if (focusScrollTimeoutRef.current) {
                clearTimeout(focusScrollTimeoutRef.current);
            }

            sendTyping(false);
        };
    }, [connect, loadHistory, sendTyping]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages.length]);

    const sortedUsers = useMemo(() => {
        return [...allUsers]
            .map((user) => ({
                ...user,
                isOnline: onlineUsers.some((online) => online.id === user.id)
            }))
            .sort((left, right) => {
                if (left.isOnline === right.isOnline) {
                    return left.name.localeCompare(right.name);
                }

                return left.isOnline ? -1 : 1;
            });
    }, [allUsers, onlineUsers]);

    const handleSend = async (
        text: string,
        attachment?: ChatAttachment
    ): Promise<void> => {
        await sendMessage(text, attachment);
    };

    const handleTyping = (): void => {
        sendTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(false);
        }, 2_000);
    };

    const handleInputFocus = (): void => {
        if (focusScrollTimeoutRef.current) {
            clearTimeout(focusScrollTimeoutRef.current);
        }

        focusScrollTimeoutRef.current = setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 180);
    };

    const openMembers = (): void => {
        setShowOnlineModal(true);

        if (!directoryLoaded && !directoryLoading) {
            fetchDirectory().catch(() => undefined);
        }
    };

    const statusLabel = connected
        ? `${onlineUsers.length} en línea`
        : connectionError ?? 'Reconectando...';

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <TouchableOpacity
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.cardColor,
                        borderBottomColor: colors.borderColor
                    }
                ]}
                activeOpacity={0.7}
                onPress={openMembers}
            >
                <View style={styles.flexOne}>
                    <Text style={[styles.headerTitle, { color: colors.textColor }]}>Chat del coro</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.dot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
                        <Text
                            numberOfLines={1}
                            style={[styles.headerSubtitle, { color: colors.secondaryTextColor }]}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                </View>
                <Ionicons name="people" size={24} color={colors.primaryColor} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ChatMessageItem message={item} />}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    removeClippedSubviews={Platform.OS === 'android'}
                    ListEmptyComponent={loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primaryColor} />
                            <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
                                Cargando mensajes...
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                            Aún no hay mensajes en este coro.
                        </Text>
                    )}
                />

                {typingUsers.length > 0 && (
                    <View style={[styles.typingContainer, { backgroundColor: colors.backgroundColor }]}>
                        <Text style={[styles.typingText, { color: colors.secondaryTextColor }]}>
                            {typingUsers.length === 1
                                ? `${typingUsers[0]} está escribiendo...`
                                : `${typingUsers.length} personas están escribiendo...`}
                        </Text>
                    </View>
                )}

                <ChatInput
                    onSend={handleSend}
                    onTyping={handleTyping}
                    onFocus={handleInputFocus}
                />
            </KeyboardAvoidingView>

            <Modal
                visible={showOnlineModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowOnlineModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>Miembros</Text>
                            <TouchableOpacity onPress={() => setShowOnlineModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textColor} />
                            </TouchableOpacity>
                        </View>

                        {directoryLoading && !directoryLoaded ? (
                            <View style={styles.directoryStatus}>
                                <ActivityIndicator color={colors.primaryColor} />
                                <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
                                    Cargando miembros...
                                </Text>
                            </View>
                        ) : directoryError && !directoryLoaded ? (
                            <View style={styles.directoryStatus}>
                                <Text style={[styles.directoryError, { color: colors.secondaryTextColor }]}>
                                    {directoryError}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                                    onPress={() => void fetchDirectory(true)}
                                    disabled={directoryLoading}
                                >
                                    <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>
                                        Reintentar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={sortedUsers}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={[styles.userItem, { borderBottomColor: colors.borderColor }]}>
                                        <View style={styles.userAvatar}>
                                            {item.imageUrl ? (
                                                <Image
                                                    source={{ uri: item.imageUrl }}
                                                    style={[styles.avatarImage, { opacity: item.isOnline ? 1 : 0.55 }]}
                                                />
                                            ) : (
                                                <View style={[styles.avatarFallback, { backgroundColor: colors.backgroundColor }]}>
                                                    <Text style={[styles.avatarInitials, { color: colors.textColor }]}>
                                                        {item.name.slice(0, 2).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View
                                                style={[
                                                    styles.onlineBadge,
                                                    { backgroundColor: item.isOnline ? '#4CAF50' : '#BDBDBD' }
                                                ]}
                                            />
                                        </View>
                                        <View>
                                            <Text style={[styles.userName, { color: colors.textColor }]}>{item.name}</Text>
                                            <Text style={[styles.userStatus, { color: colors.secondaryTextColor }]}>
                                                {item.isOnline ? 'En línea' : 'Desconectado'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={(
                                    <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                                        No hay miembros para mostrar.
                                    </Text>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flexOne: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    headerSubtitle: { fontSize: 12, flex: 1 },
    listContent: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },
    emptyText: { padding: 24, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingText: { marginTop: 10, fontSize: 13 },
    typingContainer: { paddingHorizontal: 16, paddingVertical: 5 },
    typingText: { fontSize: 12, fontStyle: 'italic' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    modalContent: { maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    directoryStatus: { minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 20 },
    directoryError: { textAlign: 'center', marginBottom: 16 },
    retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    userAvatar: { marginRight: 12 },
    avatarImage: { width: 46, height: 46, borderRadius: 23 },
    avatarFallback: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { fontSize: 14, fontWeight: '700' },
    onlineBadge: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        width: 13,
        height: 13,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#ffffff'
    },
    userName: { fontSize: 16, fontWeight: '600' },
    userStatus: { fontSize: 12, marginTop: 2 }
});
