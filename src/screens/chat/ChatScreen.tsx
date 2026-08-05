// src/screens/chat/ChatScreen.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    type KeyboardEvent,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import {
    ChatInput,
    type ChatInputSendRequest
} from '../../components/chatMessages/ChatInput';
import { ChatMessageItem } from '../../components/chatMessages/ChatMessageItem';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import type { ChatMessage } from '../../types/chat';
import {
    useChatDirectoryQuery,
    useChatHistoryQuery,
    useMarkChatReceiptsMutation,
    useSendChatMessageMutation
} from '../../hooks/query/useChatData';

interface ScrollToIndexFailureInfo {
    readonly index: number;
    readonly highestMeasuredFrameIndex: number;
    readonly averageItemLength: number;
}

export const ChatScreen = () => {
    const flatListRef = useRef<FlatList<ChatMessage>>(null);
    const composerRef = useRef<View>(null);
    const composerShiftRef = useRef(0);
    const keyboardTopRef = useRef<number | null>(null);
    const keyboardVisibleRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingReadKeyRef = useRef('');
    const [showOnlineModal, setShowOnlineModal] = useState(false);
    const [composerShift, setComposerShift] = useState(0);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const colors = useTheme().currentTheme;
    const isFocused = useIsFocused();
    const historyQuery = useChatHistoryQuery(isFocused);
    const directoryQuery = useChatDirectoryQuery(showOnlineModal);
    const sendMutation = useSendChatMessageMutation();
    const receiptMutation = useMarkChatReceiptsMutation();
    const messages = historyQuery.data ?? [];
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const connected = useChatStore((state) => state.connected);
    const connectionError = useChatStore((state) => state.connectionError);
    const onlineUsers = useChatStore((state) => state.onlineUsers);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const connect = useChatStore((state) => state.connect);
    const sendTyping = useChatStore((state) => state.sendTyping);
    const allUsers = directoryQuery.data ?? [];

    const resetComposerShift = useCallback((): void => {
        keyboardVisibleRef.current = false;
        keyboardTopRef.current = null;
        composerShiftRef.current = 0;
        setComposerShift(0);
    }, []);

    const measureComposerOverlap = useCallback((): void => {
        if (!keyboardVisibleRef.current || keyboardTopRef.current === null) {
            resetComposerShift();
            return;
        }

        requestAnimationFrame(() => {
            composerRef.current?.measureInWindow((_x, y, _width, height) => {
                const keyboardTop = keyboardTopRef.current;

                if (!keyboardVisibleRef.current || keyboardTop === null) {
                    resetComposerShift();
                    return;
                }

                const unshiftedBottom = y + height + composerShiftRef.current;
                const overlap = Math.max(0, unshiftedBottom - keyboardTop);
                composerShiftRef.current = overlap;
                setComposerShift(overlap);

                requestAnimationFrame(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                });
            });
        });
    }, [resetComposerShift]);

    useEffect(() => {
        if (isFocused) {
            connect();
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(false);
        resetComposerShift();
    }, [connect, isFocused, resetComposerShift, sendTyping]);

    useEffect(() => {
        const handleKeyboardFrame = (event: KeyboardEvent): void => {
            const keyboardTop = event.endCoordinates.screenY;
            const screenHeight = Dimensions.get('screen').height;
            const keyboardHidden = event.endCoordinates.height <= 0 || keyboardTop >= screenHeight - 1;

            if (keyboardHidden) {
                resetComposerShift();
                return;
            }

            keyboardVisibleRef.current = true;
            keyboardTopRef.current = keyboardTop;
            measureComposerOverlap();
        };
        const handleKeyboardHide = (): void => {
            resetComposerShift();
        };
        const subscriptions = Platform.OS === 'ios'
            ? [
                Keyboard.addListener('keyboardWillShow', handleKeyboardFrame),
                Keyboard.addListener('keyboardWillChangeFrame', handleKeyboardFrame),
                Keyboard.addListener('keyboardDidShow', handleKeyboardFrame),
                Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
                Keyboard.addListener('keyboardDidHide', handleKeyboardHide)
            ]
            : [
                Keyboard.addListener('keyboardDidShow', handleKeyboardFrame),
                Keyboard.addListener('keyboardDidHide', handleKeyboardHide)
            ];

        return () => {
            subscriptions.forEach((subscription) => subscription.remove());
        };
    }, [measureComposerOverlap, resetComposerShift]);

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            if (scrollRetryTimeoutRef.current) {
                clearTimeout(scrollRetryTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: false }));
        }
    }, [messages.length]);

    useEffect(() => {
        if (!isFocused || !currentUserId || receiptMutation.isPending) {
            return;
        }

        const unreadMessageIds = messages
            .filter((message) =>
                message.author.id !== currentUserId &&
                !message.readBy.includes(currentUserId)
            )
            .map((message) => message.id)
            .filter(Boolean);
        const readKey = unreadMessageIds.join(':');

        if (!readKey || pendingReadKeyRef.current === readKey) {
            return;
        }

        pendingReadKeyRef.current = readKey;
        receiptMutation.mutate(
            { messageIds: unreadMessageIds, status: 'READ' },
            {
                onError: () => {
                    pendingReadKeyRef.current = '';
                }
            }
        );
    }, [currentUserId, isFocused, messages, receiptMutation]);

    const sortedUsers = useMemo(() => [...allUsers]
        .map((user) => ({
            ...user,
            isOnline: onlineUsers.some((online) => online.id === user.id)
        }))
        .sort((left, right) => {
            if (left.isOnline === right.isOnline) {
                return left.name.localeCompare(right.name);
            }
            return left.isOnline ? -1 : 1;
        }), [allUsers, onlineUsers]);

    const handleSend = async (request: ChatInputSendRequest): Promise<void> => {
        await sendMutation.mutateAsync(request);
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    };

    const handleTyping = (): void => {
        sendTyping(true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 2_000);
    };

    const scrollToLatestMessage = (): void => {
        requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        });
    };

    const highlightMessage = useCallback((messageId: string): void => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        setHighlightedMessageId(messageId);
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedMessageId(null);
            highlightTimeoutRef.current = null;
        }, 1_800);
    }, []);

    const scrollToReply = useCallback((messageId: string): void => {
        const targetIndex = messages.findIndex((message) => message.id === messageId);

        if (targetIndex < 0) {
            Alert.alert(
                'Mensaje no disponible',
                'El mensaje original ya no está dentro del historial cargado.'
            );
            return;
        }

        Keyboard.dismiss();
        highlightMessage(messageId);
        flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
            viewPosition: 0.45
        });
    }, [highlightMessage, messages]);

    const handleScrollToIndexFailed = useCallback((info: ScrollToIndexFailureInfo): void => {
        const offset = Math.max(0, info.averageItemLength * info.index);
        flatListRef.current?.scrollToOffset({ offset, animated: true });

        if (scrollRetryTimeoutRef.current) {
            clearTimeout(scrollRetryTimeoutRef.current);
        }

        scrollRetryTimeoutRef.current = setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.45
            });
            scrollRetryTimeoutRef.current = null;
        }, 250);
    }, []);

    const statusLabel = connected
        ? `${onlineUsers.length} en línea`
        : connectionError ?? 'Sincronización periódica activa';
    const statusColor = connected ? '#4CAF50' : '#FF9800';

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
                onPress={() => setShowOnlineModal(true)}
            >
                <View style={styles.flexOne}>
                    <Text style={[styles.headerTitle, { color: colors.textColor }]}>Chat del coro</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.dot, { backgroundColor: statusColor }]} />
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

            <View style={styles.chatBody}>
                <FlatList
                    ref={flatListRef}
                    style={styles.flexOne}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatMessageItem
                            message={item}
                            highlighted={item.id === highlightedMessageId}
                            onReplyPress={scrollToReply}
                        />
                    )}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: composerShift + 16 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    onScrollBeginDrag={Keyboard.dismiss}
                    onTouchStart={Keyboard.dismiss}
                    refreshing={historyQuery.isRefetching && messages.length > 0}
                    onRefresh={() => void historyQuery.refetch()}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    ListEmptyComponent={historyQuery.isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primaryColor} />
                            <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
                                Cargando mensajes...
                            </Text>
                        </View>
                    ) : historyQuery.isError ? (
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                                No fue posible cargar los mensajes.
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                                onPress={() => void historyQuery.refetch()}
                            >
                                <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.secondaryTextColor }]}>
                            Aún no hay mensajes en este coro.
                        </Text>
                    )}
                />

                <View
                    ref={composerRef}
                    collapsable={false}
                    style={[
                        styles.composerDock,
                        { transform: [{ translateY: -composerShift }] }
                    ]}
                    onLayout={() => {
                        if (keyboardVisibleRef.current) {
                            measureComposerOverlap();
                        } else if (composerShiftRef.current !== 0) {
                            resetComposerShift();
                        }
                    }}
                >
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
                        onFocus={scrollToLatestMessage}
                    />
                </View>
            </View>

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

                        {directoryQuery.isLoading ? (
                            <View style={styles.directoryStatus}>
                                <ActivityIndicator color={colors.primaryColor} />
                                <Text style={[styles.loadingText, { color: colors.secondaryTextColor }]}>
                                    Cargando miembros...
                                </Text>
                            </View>
                        ) : directoryQuery.isError ? (
                            <View style={styles.directoryStatus}>
                                <Text style={[styles.directoryError, { color: colors.secondaryTextColor }]}>
                                    No fue posible cargar los miembros.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                                    onPress={() => void directoryQuery.refetch()}
                                >
                                    <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
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
                                                    style={[styles.avatarImage, { opacity: item.isOnline ? 1 : 0.65 }]}
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
                                                {connected
                                                    ? item.isOnline ? 'En línea' : 'Desconectado'
                                                    : 'Estado en tiempo real no disponible'}
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
    chatBody: { flex: 1, position: 'relative' },
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
    listContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16, flexGrow: 1 },
    emptyText: { padding: 24, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingText: { marginTop: 10, fontSize: 13 },
    composerDock: { zIndex: 20 },
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
