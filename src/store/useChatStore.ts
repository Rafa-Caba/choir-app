import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getChatHistory, uploadChatMedia } from '../services/chat';
import type { ChatMessage, MessageType, NewMessagePayload } from '../types/chat';
import { useAuthStore } from './useAuthStore';

// Prod url
const PROD_WS_URL = 'https://choir-app-api-production.up.railway.app/ws';
const BASE_URL = PROD_WS_URL;

interface ChatState {
    messages: ChatMessage[];
    connected: boolean;
    stompClient: Client | null;
    replyingTo: ChatMessage | null;
    
    connect: () => void;
    disconnect: () => void;
    sendMessage: (textInput: string, localImageUri?: string, localAudioUri?: string) => Promise<void>;
    loadHistory: () => Promise<void>;
    setReplyingTo: (message: ChatMessage | null) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [],
            connected: false,
            stompClient: null,
            replyingTo: null,

            setReplyingTo: (message) => set({ replyingTo: message }),

            loadHistory: async () => {
                try {
                    const history = await getChatHistory();
                    set({ messages: history.reverse() });
                } catch (error) {
                    console.log("Offline: Loading cached chat history");
                }
            },

            connect: () => {
                const { user, token } = useAuthStore.getState();
                const state = get();

                if (!token || !user) return;
                if (state.stompClient?.active || state.connected) return;

                console.log("🔌 Chat: Attempting connection to:", BASE_URL);

                const client = new Client({
                    webSocketFactory: () => new SockJS(BASE_URL),
                    connectHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                    forceBinaryWSFrames: true, 
                    appendMissingNULLonIncoming: true,
                    heartbeatIncoming: 10000,
                    heartbeatOutgoing: 10000,
                    
                    onConnect: () => {
                        console.log("✅ Chat: Connected");
                        set({ connected: true });

                        client.subscribe('/topic/public', (message) => {
                            try {
                                const newMessage: ChatMessage = JSON.parse(message.body);
                                
                                set((current) => {
                                    if (current.messages.some(m => m.id === newMessage.id)) {
                                        return current;
                                    }
                                    return { messages: [...current.messages, newMessage] };
                                });
                            } catch (e) {
                                console.error("Error parsing message", e);
                            }
                        });
                    },
                    onDisconnect: () => {
                        console.log("❌ Chat: Disconnected");
                        set({ connected: false });
                    },
                    onStompError: (frame) => {
                        console.error('🚨 Chat Broker Error:', frame.headers['message']);
                    },
                    onWebSocketClose: () => {
                        console.log("🔌 Chat: Socket Closed");
                        set({ connected: false });
                    }
                });

                client.activate();
                set({ stompClient: client });
            },

            disconnect: () => {
                get().stompClient?.deactivate();
                set({ connected: false, stompClient: null });
            },

            sendMessage: async (textInput, localImageUri, localAudioUri) => {
                const { stompClient, replyingTo } = get();
                const { user } = useAuthStore.getState();

                if (!stompClient || !stompClient.active || !user) {
                    // Optional: Queue message for later if offline (advanced feature)
                    console.log("Cannot send: Offline");
                    return;
                }

                let mediaData = undefined;

                if (localImageUri) {
                    try {
                        const uploadResult = await uploadChatMedia(localImageUri);
                        mediaData = {
                            imageUrl: uploadResult.url,
                            imagePublicId: uploadResult.publicId
                        };
                    } catch (error) {
                        console.error("Failed to upload image", error);
                        return; 
                    }
                } else if (localAudioUri) {
                    try {
                        const uploadResult = await uploadChatMedia(localAudioUri); 
                        mediaData = {
                            audioUrl: uploadResult.url,
                            audioPublicId: uploadResult.publicId
                        };
                    } catch (error) { return; }
                }

                const richContent = {
                    type: "doc",
                    content: textInput ? [{ type: "paragraph", content: [{ type: "text", text: textInput }] }] : []
                };

                let msgType: MessageType = 'TEXT';
                if (localImageUri) msgType = 'IMAGE';
                else if (localAudioUri) msgType = 'AUDIO';

                const payload: NewMessagePayload = {
                    username: user.username,
                    content: richContent,
                    type: msgType,
                    imageUrl: mediaData?.imageUrl,
                    imagePublicId: mediaData?.imagePublicId,
                    audioUrl: mediaData?.audioUrl,
                    audioPublicId: mediaData?.audioPublicId,
                    replyToId: replyingTo?.id
                };

                stompClient.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify(payload),
                });

                set({ replyingTo: null });
            }
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ messages: state.messages }),
        }
    )
);