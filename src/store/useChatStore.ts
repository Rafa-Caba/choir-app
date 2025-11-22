import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import { getChatHistory, uploadChatImage } from '../services/chat';
import type { ChatMessage, NewMessagePayload, MessageType } from '../types/chat';
import { useAuthStore } from './useAuthStore';

// ⚠️ REPLACE with your LAN IP if testing on device
const WS_URL = 'ws://localhost:8080/ws';
// const WS_URL = 'wss://sweeties-spring-production.up.railway.app/ws'; // Prod

interface ChatState {
    messages: ChatMessage[];
    connected: boolean;
    stompClient: Client | null;
    replyingTo: ChatMessage | null; // <-- New State
    
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
            // Backend returns newest first. Reverse for chronological chat view.
            set({ messages: history.reverse() });
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    },

    connect: () => {
        const { user, token } = useAuthStore.getState();
        if (!token || !user) return;

        if (get().stompClient?.active) return;

        const client = new Client({
            brokerURL: WS_URL,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            // Polyfill configs for RN
            forceBinaryWSFrames: true, 
            appendMissingNULLonIncoming: true,
            
            onConnect: () => {
                console.log("✅ Connected to WebSocket");
                set({ connected: true });

                // Subscribe to public topic
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

        // 1. Handle Image Upload
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

        // 2. Construct Content
        const richContent = {
            type: "doc",
            content: textInput ? [{ type: "paragraph", content: [{ type: "text", text: textInput }] }] : []
        };

        // 3. Determine Type & Payload
        const payload: NewMessagePayload = {
            username: user.username,
            content: richContent,
            type: localImageUri ? 'IMAGE' : 'TEXT',
            imageUrl: mediaData?.imageUrl,
            imagePublicId: mediaData?.publicId,
            replyToId: replyingTo?.id
        };

        // 4. Send
        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(payload),
        });

        set({ replyingTo: null });
    }
}));