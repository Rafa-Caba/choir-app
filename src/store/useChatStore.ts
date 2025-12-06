import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, type Socket } from 'socket.io-client';

import {
    getChatHistory,
    sendTextMessage,
    uploadChatMedia,
    toggleReaction,
    normalizeChatMessage,
} from '../services/chat';
import type { ChatMessage } from '../types/chat';
import { useAuthStore } from './useAuthStore';
import choirApi from '../api/choirApi';
import ENV from '../config/env';

const SOCKET_URL = ENV.SOCKET_URL;
// const SOCKET_URL = "http://10.0.2.2:10000";

console.log('🔌 Socket URL:', SOCKET_URL);

interface ConnectedUser {
    id: string;
    name: string;
    username: string;
    imageUrl?: string;
    _id?: string;
}

interface ChatState {
    messages: ChatMessage[];
    connected: boolean;
    socket: Socket | null;
    replyingTo: ChatMessage | null;
    loading: boolean;

    onlineUsers: ConnectedUser[];
    allUsers: ConnectedUser[];
    typingUsers: string[];

    connect: () => void;
    disconnect: () => void;
    sendMessage: (
        textInput: string,
        attachment?: { uri: string; type: 'image' | 'video' | 'audio' | 'file' }
    ) => Promise<void>;
    sendTyping: (isTyping: boolean) => void;
    reactToMessage: (messageId: string, emoji: string) => Promise<void>;

    loadHistory: () => Promise<void>;
    fetchDirectory: () => Promise<void>;
    setReplyingTo: (message: ChatMessage | null) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [],
            onlineUsers: [],
            allUsers: [],
            typingUsers: [],
            connected: false,
            socket: null,
            replyingTo: null,
            loading: false,

            setReplyingTo: (message) => set({ replyingTo: message }),

            loadHistory: async () => {
                set({ loading: true });
                try {
                    const history = await getChatHistory();
                    set({ messages: history });
                } catch (error) {
                    console.log('Offline: Loading cached chat history');
                } finally {
                    set({ loading: false });
                }
            },

            fetchDirectory: async () => {
                try {
                    const { data } = await choirApi.get('/users/directory');
                    set({ allUsers: data });
                } catch (e) {
                    console.error('Directory fetch failed', e);
                }
            },

            connect: () => {
                const { token, user } = useAuthStore.getState();
                const state = get();

                if (!token || (state.socket && state.socket.connected)) return;

                console.log('🔌 Chat: Connecting to', SOCKET_URL);

                const socket = io(SOCKET_URL, {
                    auth: { token, user },
                    transports: ['websocket'],
                    reconnection: true,
                    forceNew: true,
                });

                socket.on('connect', () => {
                    console.log('✅ Socket Connected ID:', socket.id);
                    set({ connected: true });
                });

                socket.on('disconnect', () => {
                    console.log('❌ Socket Disconnected');
                    set({ connected: false, onlineUsers: [] });
                });

                socket.on('new-message', (rawMessage: any) => {
                    const newMessage = normalizeChatMessage(rawMessage);

                    set((current) => {
                        if (current.messages.some((m) => m.id === newMessage.id)) return current;
                        return { messages: [...current.messages, newMessage] };
                    });
                });

                socket.on('message-updated', (rawUpdated: any) => {
                    const updatedMessage = normalizeChatMessage(rawUpdated);

                    set((current) => ({
                        messages: current.messages.map((m) =>
                            m.id === updatedMessage.id ? updatedMessage : m
                        ),
                    }));
                });

                socket.on('online-users', (users: ConnectedUser[]) => {
                    const uniqueUsers = users.filter(
                        (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i
                    );
                    set({ onlineUsers: uniqueUsers });
                });

                socket.on('user-typing', ({ username, isTyping }) => {
                    set((state) => {
                        let newTyping = [...state.typingUsers];
                        if (isTyping) {
                            if (!newTyping.includes(username)) newTyping.push(username);
                        } else {
                            newTyping = newTyping.filter((u) => u !== username);
                        }
                        return { typingUsers: newTyping };
                    });
                });

                set({ socket });
            },

            disconnect: () => {
                const { socket } = get();
                if (socket) socket.disconnect();
                set({ connected: false, socket: null, onlineUsers: [] });
            },

            sendTyping: (isTyping) => {
                const { socket } = get();
                if (socket?.connected) socket.emit('typing', isTyping);
            },

            reactToMessage: async (messageId, emoji) => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                const previousMessages = get().messages;

                set((state) => ({
                    messages: state.messages.map((m) => {
                        if (m.id.toString() === messageId.toString()) {
                            const currentReactions = m.reactions || [];

                            const userReactionIndex = currentReactions.findIndex((r) => {
                                const rUserId =
                                    (r.user as any).id || (r.user as any)._id || r.user;
                                return rUserId?.toString() === user.id;
                            });

                            let newReactions = [...currentReactions];

                            if (userReactionIndex > -1) {
                                if (currentReactions[userReactionIndex].emoji === emoji) {
                                    newReactions.splice(userReactionIndex, 1);
                                } else {
                                    newReactions[userReactionIndex] = {
                                        ...newReactions[userReactionIndex],
                                        emoji,
                                    };
                                }
                            } else {
                                newReactions.push({
                                    emoji,
                                    user: {
                                        id: user.id,
                                        username: user.username,
                                        name: user.name,
                                    } as any,
                                });
                            }

                            return { ...m, reactions: newReactions };
                        }
                        return m;
                    }),
                }));

                try {
                    await toggleReaction(messageId, emoji);
                } catch (e) {
                    console.error('Reaction failed', e);
                    set({ messages: previousMessages });
                }
            },

            sendMessage: async (textInput, attachment) => {
                const { replyingTo, socket } = get();

                if (!socket?.connected) {
                    console.warn('Socket not connected. Attempting HTTP fallback...');
                }

                try {
                    get().sendTyping(false);
                    let uploadedUrl = '';
                    let messageType: any = 'TEXT';

                    if (attachment) {
                        uploadedUrl = await uploadChatMedia(attachment.uri, attachment.type);
                        switch (attachment.type) {
                            case 'video':
                                messageType = 'VIDEO';
                                break;
                            case 'image':
                                messageType = 'IMAGE';
                                break;
                            case 'audio':
                                messageType = 'AUDIO';
                                break;
                            case 'file':
                                messageType = 'FILE';
                                break;
                        }
                    }

                    const payload: any = {
                        content: textInput,
                        type: messageType,
                        ...(uploadedUrl ? { fileUrl: uploadedUrl } : {}),
                        replyToId: replyingTo?.id,
                    };

                    console.log('📤 Sending payload:', { payload });

                    if (attachment || textInput.trim().length > 0) {
                        await sendTextMessage(payload);
                    }

                    set({ replyingTo: null });
                } catch (err) {
                    console.error('Send Error:', err);
                }
            },
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ messages: state.messages }),
        }
    )
);
