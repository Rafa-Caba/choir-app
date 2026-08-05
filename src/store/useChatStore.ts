// src/store/useChatStore.ts

import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import ENV from '../config/env';
import { toggleReaction } from '../services/chat';
import type {
    ChatMessage,
    RawChatMessage,
    SocketDisconnectNotice,
    SocketPresenceUser,
    SocketTypingEvent
} from '../types/chat';
import { normalizeChatMessage } from '../utils/normalizeChatMessage';
import { useAuthStore } from './useAuthStore';
import { useTargetChoirStore } from './useTargetChoirStore';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { upsertChatMessage } from '../query/chatCache';

interface ServerToClientEvents {
    readonly 'online-users': (users: readonly SocketPresenceUser[]) => void;
    readonly 'user-typing': (payload: SocketTypingEvent) => void;
    readonly 'new-message': (message: RawChatMessage) => void;
    readonly 'message-updated': (message: RawChatMessage) => void;
    readonly 'session-disconnected': (notice: SocketDisconnectNotice) => void;
}

interface ClientToServerEvents {
    readonly typing: (isTyping: boolean) => void;
}

type ChoirSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ChatState {
    readonly connected: boolean;
    readonly connectionError: string | null;
    readonly socket: ChoirSocket | null;
    readonly replyingTo: ChatMessage | null;
    readonly onlineUsers: readonly SocketPresenceUser[];
    readonly typingUsers: readonly string[];
    connect: () => void;
    disconnect: () => void;
    sendTyping: (isTyping: boolean) => void;
    reactToMessage: (messageId: string, emoji: string) => Promise<void>;
    setReplyingTo: (message: ChatMessage | null) => void;
    reset: () => void;
}

const disconnectSocket = (socket: ChoirSocket | null): void => {
    socket?.removeAllListeners();
    socket?.io.removeAllListeners();
    socket?.disconnect();
};

const resolveConnectionError = (message: string): string => {
    const normalized = message.toLowerCase();

    if (normalized.includes('timeout')) {
        return 'Tiempo real no disponible; el chat seguirá sincronizando';
    }

    return 'Tiempo real no disponible; el chat seguirá sincronizando';
};

const updateCachedMessage = (raw: RawChatMessage): void => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return;
    }

    queryClient.setQueryData<readonly ChatMessage[]>(
        queryKeys.chatHistory(scope.tenantKey),
        (current) => upsertChatMessage(current, normalizeChatMessage(raw))
    );
};

export const useChatStore = create<ChatState>((set, get) => ({
    connected: false,
    connectionError: null,
    socket: null,
    replyingTo: null,
    onlineUsers: [],
    typingUsers: [],

    setReplyingTo: (message) => set({ replyingTo: message }),

    connect: () => {
        const { token, user, requiresPasswordChange } = useAuthStore.getState();
        const targetChoirId = useTargetChoirStore.getState().selectedChoir?.id ?? null;
        const existing = get().socket;

        if (
            !token ||
            !user ||
            requiresPasswordChange ||
            existing?.connected ||
            existing?.active ||
            (user.role === 'SUPER_ADMIN' && !targetChoirId)
        ) {
            return;
        }

        disconnectSocket(existing);

        const socketAuth = user.role === 'SUPER_ADMIN'
            ? { accessToken: token, targetChoirId }
            : { accessToken: token };
        const socket: ChoirSocket = io(ENV.SOCKET_URL, {
            path: '/socket.io',
            auth: socketAuth,
            autoConnect: false,
            forceNew: true,
            multiplex: false,
            transports: ['websocket'],
            upgrade: false,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: 2,
            reconnectionDelay: 1_500,
            reconnectionDelayMax: 6_000,
            randomizationFactor: 0.3,
            timeout: 8_000
        });

        socket.on('connect', () => set({
            connected: true,
            connectionError: null
        }));
        socket.on('connect_error', (error: Error) => set({
            connected: false,
            connectionError: resolveConnectionError(error.message)
        }));
        socket.on('disconnect', (reason) => set({
            connected: false,
            connectionError: reason === 'io client disconnect'
                ? null
                : 'Tiempo real no disponible; el chat seguirá sincronizando',
            onlineUsers: [],
            typingUsers: []
        }));
        socket.on('new-message', updateCachedMessage);
        socket.on('message-updated', updateCachedMessage);
        socket.on('online-users', (users) => set({ onlineUsers: users }));
        socket.on('user-typing', ({ username, isTyping }) => set((state) => ({
            typingUsers: isTyping
                ? [...new Set([...state.typingUsers, username])]
                : state.typingUsers.filter((item) => item !== username)
        })));
        socket.on('session-disconnected', () => {
            useAuthStore.getState().expireSession().catch(() => undefined);
        });

        set({
            socket,
            connected: false,
            connectionError: null
        });
        socket.connect();
    },

    disconnect: () => {
        disconnectSocket(get().socket);
        set({
            socket: null,
            connected: false,
            connectionError: null,
            onlineUsers: [],
            typingUsers: []
        });
    },

    sendTyping: (isTyping) => {
        const socket = get().socket;

        if (socket?.connected) {
            socket.emit('typing', isTyping);
        }
    },

    reactToMessage: async (messageId, emoji) => {
        const updated = await toggleReaction(messageId, emoji);
        const scope = getTenantQueryScopeSnapshot();

        if (scope.enabled) {
            queryClient.setQueryData<readonly ChatMessage[]>(
                queryKeys.chatHistory(scope.tenantKey),
                (current) => upsertChatMessage(current, updated)
            );
        }
    },

    reset: () => {
        disconnectSocket(get().socket);
        set({
            connected: false,
            connectionError: null,
            socket: null,
            replyingTo: null,
            onlineUsers: [],
            typingUsers: []
        });
    }
}));
