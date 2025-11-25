import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getChatHistory, uploadChatMedia } from '../services/chat';
import type { ChatMessage, MessageType, NewMessagePayload } from '../types/chat';
import { useAuthStore } from './useAuthStore';

// 1. CHANGE PROTOCOLS: SockJS needs http/https, not ws/wss
// Local url
// const WS_URL = 'http://localhost:8080/ws';

// Prod url
// Note: No "/ws" at the end needed if your backend endpoint is just "/ws", 
// but usually SockJS clients take the full base endpoint.
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

export const useChatStore = create<ChatState>((set, get) => ({
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
            console.error("Failed to load chat history", error);
        }
    },

    connect: () => {
        const { user, token } = useAuthStore.getState();
        const state = get();

        // 1. Basic Validation
        if (!token || !user) {
            console.log("⚠️ Chat: Cannot connect without token or user.");
            return;
        }

        // 2. Prevent Double Connections
        // If we are already active or marked as connected, don't try again.
        if (state.stompClient?.active || state.connected) {
            console.log("⚠️ Chat: Already connected, skipping init.");
            return;
        }

        console.log("🔌 Chat: Attempting connection to:", BASE_URL);

        const client = new Client({
            // 3. SockJS Factory (Critical for Railway Proxies)
            webSocketFactory: () => new SockJS(BASE_URL),
            
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            
            // React Native Polyfills
            forceBinaryWSFrames: true, 
            appendMissingNULLonIncoming: true,
            
            // Keep the connection alive
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            
            onConnect: () => {
                console.log("✅ Chat: Connected via SockJS");
                set({ connected: true });

                client.subscribe('/topic/public', (message) => {
                    try {
                        const newMessage: ChatMessage = JSON.parse(message.body);
                        
                        // 4. Duplicate Check (Safety for Reconnects)
                        set((current) => {
                            const alreadyExists = current.messages.some(m => m.id === newMessage.id);
                            if (alreadyExists) return current;
                            return { messages: [...current.messages, newMessage] };
                        });
                    } catch (e) {
                        console.error("Error parsing incoming message", e);
                    }
                });
            },

            onDisconnect: () => {
                console.log("❌ Chat: Disconnected (Clean)");
                set({ connected: false });
            },

            onStompError: (frame) => {
                console.error('🚨 Chat Broker Error:', frame.headers['message']);
                console.error('Details:', frame.body);
            },

            // 5. Handle Network Drops (Critical for Mobile)
            onWebSocketClose: () => {
                console.log("🔌 Chat: Socket Connection Closed (Network/Server)");
                set({ connected: false });
            },

            debug: (str) => {
                if (__DEV__) console.log('STOMP: ' + str);
            }
        });

        client.activate();
        set({ stompClient: client });
    },

    disconnect: () => {
        get().stompClient?.deactivate();
        set({ connected: false, stompClient: null });
    },

    sendMessage: async (textInput: string, localImageUri?: string, localAudioUri?: string) => {
        const { stompClient, replyingTo } = get();
        const { user } = useAuthStore.getState();

        if (!stompClient || !stompClient.active || !user) return;

        // Handle Uploads (Image OR Audio)
        let mediaData = undefined;

        if (localImageUri) {
            try {
                const uploadResult = await uploadChatMedia(localImageUri);
                mediaData = {
                    imageUrl: uploadResult.url,
                    publicId: uploadResult.publicId
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
            audioUrl: mediaData?.audioUrl,
            imagePublicId: mediaData?.publicId,
            replyToId: replyingTo?.id
        };

        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(payload),
        });

        set({ replyingTo: null });
    }
}));