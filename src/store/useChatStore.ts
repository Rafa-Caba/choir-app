// src/store/useChatStore.ts

import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import ENV from '../config/env';
import { markChatReceipts, toggleReaction } from '../services/chat';
import type {
    ChatMessage,
    RawChatMessage,
    SocketDisconnectNotice,
    SocketPresenceUser,
    SocketTypingEvent
} from '../types/chat';
import type { AppNotification, SocketNotificationRemoval } from '../types/notification';
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
    readonly 'notification-created': (notification: AppNotification) => void;
    readonly 'notification-removed': (payload: SocketNotificationRemoval) => void;
    readonly 'notifications-read': () => void;
    readonly 'session-disconnected': (notice: SocketDisconnectNotice) => void;
}

interface ClientToServerEvents {
    readonly typing: (isTyping: boolean) => void;
}

type ChoirSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketAuthPayload {
    readonly accessToken: string;
    readonly targetChoirId?: string;
}

interface ChatState {
    readonly connected: boolean;
    readonly connectionError: string | null;
    readonly connectionKey: string | null;
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

const resolveConnectionError = (): string => {
    return 'Tiempo real no disponible; el chat seguirá sincronizando';
};

const buildSocketContext = (): {
    readonly auth: SocketAuthPayload;
    readonly connectionKey: string;
} | null => {
    const { token, user, requiresPasswordChange } = useAuthStore.getState();
    const targetChoirId = useTargetChoirStore.getState().selectedChoir?.id ?? null;
    const choirId = user?.role === 'SUPER_ADMIN' ? targetChoirId : user?.choirId ?? null;

    if (!token || !user || requiresPasswordChange || !choirId) {
        return null;
    }

    return {
        auth: user.role === 'SUPER_ADMIN'
            ? { accessToken: token, targetChoirId: choirId }
            : { accessToken: token },
        connectionKey: `${user.id}:${choirId}:${user.sessionVersion}`
    };
};

const updateCachedMessage = (raw: RawChatMessage): ChatMessage | null => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return null;
    }

    const normalized = normalizeChatMessage(raw);
    queryClient.setQueryData<readonly ChatMessage[]>(
        queryKeys.chatHistory(scope.tenantKey),
        (current) => upsertChatMessage(current, normalized)
    );
    return normalized;
};

const updateCachedMessages = (messages: readonly ChatMessage[]): void => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return;
    }

    queryClient.setQueryData<readonly ChatMessage[]>(
        queryKeys.chatHistory(scope.tenantKey),
        (current) => messages.reduce<readonly ChatMessage[]>(
            (cached, message) => upsertChatMessage(cached, message),
            current ?? []
        )
    );
};


const invalidateNotifications = (): void => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return;
    }

    void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications(scope.tenantKey)
    });
};

const handleIncomingMessage = (raw: RawChatMessage): void => {
    const message = updateCachedMessage(raw);
    const currentUserId = useAuthStore.getState().user?.id ?? '';

    if (!message || !currentUserId || message.author.id === currentUserId) {
        return;
    }

    void markChatReceipts([message.id], 'DELIVERED')
        .then(updateCachedMessages)
        .catch(() => undefined);
};


export const useChatStore = create<ChatState>((set, get) => ({
    connected: false,
    connectionError: null,
    connectionKey: null,
    socket: null,
    replyingTo: null,
    onlineUsers: [],
    typingUsers: [],

    setReplyingTo: (message) => set({ replyingTo: message }),

    connect: () => {
        const context = buildSocketContext();

        if (!context) {
            get().disconnect();
            return;
        }

        const existing = get().socket;

        if (existing && get().connectionKey === context.connectionKey) {
            existing.auth = context.auth;

            if (!existing.connected && !existing.active) {
                existing.connect();
            }
            return;
        }

        disconnectSocket(existing);

        const socket: ChoirSocket = io(ENV.SOCKET_URL, {
            path: '/socket.io',
            auth: context.auth,
            autoConnect: false,
            forceNew: true,
            multiplex: false,
            transports: ['polling'],
            upgrade: false,
            rememberUpgrade: false,
            tryAllTransports: false,
            reconnection: true,
            reconnectionAttempts: Number.POSITIVE_INFINITY,
            reconnectionDelay: 1_000,
            reconnectionDelayMax: 30_000,
            randomizationFactor: 0.4,
            timeout: 20_000
        });

        socket.on('connect', () => set({
            connected: true,
            connectionError: null
        }));
        socket.on('connect_error', () => set({
            connected: false,
            connectionError: resolveConnectionError()
        }));
        socket.on('disconnect', (reason) => set({
            connected: false,
            connectionError: reason === 'io client disconnect'
                ? null
                : resolveConnectionError(),
            onlineUsers: [],
            typingUsers: []
        }));
        socket.on('new-message', handleIncomingMessage);
        socket.on('message-updated', updateCachedMessage);
        socket.on('notification-created', invalidateNotifications);
        socket.on('notification-removed', invalidateNotifications);
        socket.on('notifications-read', invalidateNotifications);
        socket.on('online-users', (users) => set({ onlineUsers: users }));
        socket.on('user-typing', ({ username, isTyping }) => set((state) => ({
            typingUsers: isTyping
                ? [...new Set([...state.typingUsers, username])]
                : state.typingUsers.filter((item) => item !== username)
        })));
        socket.on('session-disconnected', () => {
            useAuthStore.getState().expireSession().catch(() => undefined);
        });
        socket.io.on('reconnect_attempt', () => {
            const latestContext = buildSocketContext();

            if (latestContext?.connectionKey === context.connectionKey) {
                socket.auth = latestContext.auth;
            }
        });

        set({
            socket,
            connectionKey: context.connectionKey,
            connected: false,
            connectionError: null,
            onlineUsers: [],
            typingUsers: []
        });
        socket.connect();
    },

    disconnect: () => {
        disconnectSocket(get().socket);
        set({
            socket: null,
            connectionKey: null,
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
            connectionKey: null,
            socket: null,
            replyingTo: null,
            onlineUsers: [],
            typingUsers: []
        });
    }
}));
