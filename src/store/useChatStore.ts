import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getChatHistory, uploadChatImage } from '../services/chat';
import type { ChatMessage, NewMessagePayload } from '../types/chat';
import { useAuthStore } from './useAuthStore';

// 1. CHANGE PROTOCOLS: SockJS needs http/https, not ws/wss
// Local url
const WS_URL = 'http://localhost:8080/ws';

// Prod url
// Note: No "/ws" at the end needed if your backend endpoint is just "/ws", 
// but usually SockJS clients take the full base endpoint.
const PROD_WS_URL = 'https://choir-app-api-production.up.railway.app/ws';

const BASE_URL = __DEV__ ? WS_URL : PROD_WS_URL;

interface ChatState {
    messages: ChatMessage[];
    connected: boolean;
    stompClient: Client | null;
    replyingTo: ChatMessage | null;
    
    connect: () => void;
    disconnect: () => void;
    sendMessage: (content: string, imageUri?: string) => Promise<void>;
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
        if (!token || !user) return;

        // Prevent double connection
        if (get().stompClient?.active) return;

        const client = new Client({
            // This creates a robust SockJS connection that survives Railway proxies
            webSocketFactory: () => new SockJS(BASE_URL),
            
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            
            // React Native Configs
            forceBinaryWSFrames: true, 
            appendMissingNULLonIncoming: true,
            
            // Heartbeat config (Matches Backend)
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            
            onConnect: () => {
                console.log("✅ Connected to WebSocket via SockJS");
                set({ connected: true });

                client.subscribe('/topic/public', (message) => {
                    const newMessage: ChatMessage = JSON.parse(message.body);
                    set((state) => ({ 
                        messages: [...state.messages, newMessage] 
                    }));
                });
            },
            onDisconnect: () => {
                console.log("❌ Disconnected");
                set({ connected: false });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            // Add a debug function to see connection attempts in logs
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

    sendMessage: async (textInput: string, localImageUri?: string) => {
        const { stompClient, replyingTo } = get();
        const { user } = useAuthStore.getState();

        if (!stompClient || !stompClient.active || !user) return;

        let mediaData = undefined;
        if (localImageUri) {
            try {
                const uploadResult = await uploadChatImage(localImageUri);
                mediaData = {
                    imageUrl: uploadResult.url,
                    publicId: uploadResult.publicId
                };
            } catch (error) {
                console.error("Failed to upload image", error);
                return; 
            }
        }

        const richContent = {
            type: "doc",
            content: textInput ? [{ type: "paragraph", content: [{ type: "text", text: textInput }] }] : []
        };

        const payload: NewMessagePayload = {
            username: user.username,
            content: richContent,
            type: localImageUri ? 'IMAGE' : 'TEXT',
            imageUrl: mediaData?.imageUrl,
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