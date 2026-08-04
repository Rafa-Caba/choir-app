// src/store/useChatStore.ts

import { create } from 'zustand';
import {
    io,
    type Socket
} from 'socket.io-client';
import choirApi from '../api/choirApi';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import ENV from '../config/env';
import {
    sendChatMessage,
    toggleReaction,
    uploadChatMedia,
    type ChatAttachment,
    type ChatAttachmentType
} from '../services/chat';
import { syncCacheFirst } from '../services/sync';
import { readCache, writeCache } from '../storage/cacheStorage';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type {
    ChatMessage,
    ChatUserSummary,
    MessageType,
    RawChatMessage,
    SocketDisconnectNotice,
    SocketPresenceUser,
    SocketTypingEvent
} from '../types/chat';
import { normalizeChatMessage } from '../utils/normalizeChatMessage';
import { useAuthStore } from './useAuthStore';
import { useTargetChoirStore } from './useTargetChoirStore';

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

interface ChatDirectoryResponse {
    readonly users: readonly ChatUserSummary[];
}

interface ChatState {
    messages: ChatMessage[];
    connected: boolean;
    connectionError: string | null;
    socket: ChoirSocket | null;
    replyingTo: ChatMessage | null;
    loading: boolean;
    onlineUsers: readonly SocketPresenceUser[];
    allUsers: readonly ChatUserSummary[];
    typingUsers: readonly string[];

    connect: () => void;
    disconnect: () => void;
    sendMessage: (textInput: string, attachment?: ChatAttachment) => Promise<void>;
    sendTyping: (isTyping: boolean) => void;
    reactToMessage: (messageId: string, emoji: string) => Promise<void>;
    loadHistory: () => Promise<void>;
    fetchDirectory: () => Promise<void>;
    setReplyingTo: (message: ChatMessage | null) => void;
    reset: () => void;
}

const getMessageMediaUrl = (message: ChatMessage): string | null => {
    return message.imageUrl ?? message.audioUrl ?? message.fileUrl ?? null;
};

const hydrateMedia = async (messages: readonly ChatMessage[]): Promise<ChatMessage[]> => {
    const context = useAuthStore.getState().getTenantContext();

    if (!context) {
        return [...messages];
    }

    return Promise.all(messages.map(async (message) => ({
        ...message,
        cachedMediaUrl: await cacheRemoteMedia(context, 'chat', getMessageMediaUrl(message))
    })));
};

const addOrReplaceMessage = (
    messages: readonly ChatMessage[],
    incoming: ChatMessage
): ChatMessage[] => {
    const index = messages.findIndex((message) => message.id === incoming.id);

    if (index < 0) {
        return [...messages, incoming];
    }

    return messages.map((message) => message.id === incoming.id ? incoming : message);
};

const getRawMessageId = (message: RawChatMessage): string => message.id ?? message._id ?? '';

const mergeChatHistory = (
    cachedMessages: readonly RawChatMessage[],
    changedMessages: readonly RawChatMessage[]
): readonly RawChatMessage[] => {
    const byId = new Map<string, RawChatMessage>();

    cachedMessages.forEach((message) => byId.set(getRawMessageId(message), message));
    changedMessages.forEach((message) => byId.set(getRawMessageId(message), message));

    return [...byId.values()]
        .filter((message) => getRawMessageId(message).length > 0)
        .sort((left, right) => {
            const leftTime = Date.parse(left.createdAt ?? '');
            const rightTime = Date.parse(right.createdAt ?? '');
            return leftTime - rightTime;
        })
        .slice(-200);
};

const toRawChatMessage = (message: ChatMessage): RawChatMessage => ({
    id: message.id,
    author: message.author,
    content: message.content,
    type: message.type,
    fileUrl: message.fileUrl,
    filename: message.filename,
    imageUrl: message.imageUrl,
    audioUrl: message.audioUrl,
    imagePublicId: message.imagePublicId,
    reactions: message.reactions.map((reaction) => ({
        emoji: reaction.emoji,
        user: reaction.user,
        username: reaction.username
    })),
    replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.textPreview,
            author: { username: message.replyTo.username }
        }
        : null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
});

const persistChatChanges = async (
    changedMessages: readonly RawChatMessage[]
): Promise<void> => {
    const context = useAuthStore.getState().getTenantContext();

    if (!context) {
        return;
    }

    const cached = await readCache<readonly RawChatMessage[]>(context, 'chat');
    const merged = mergeChatHistory(cached?.data ?? [], changedMessages);
    await writeCache(
        context,
        'chat',
        merged,
        null,
        CACHE_TTL_MS.chat,
        cached?.syncedAt ?? new Date(0).toISOString()
    );
};

const mapAttachmentType = (type: ChatAttachmentType): MessageType => {
    switch (type) {
        case 'image': return 'IMAGE';
        case 'video': return 'VIDEO';
        case 'audio': return 'AUDIO';
        case 'file': return 'FILE';
    }
};

const disconnectSocket = (socket: ChoirSocket | null): void => {
    socket?.removeAllListeners();
    socket?.disconnect();
};

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    onlineUsers: [],
    allUsers: [],
    typingUsers: [],
    connected: false,
    connectionError: null,
    socket: null,
    replyingTo: null,
    loading: false,

    setReplyingTo: (message) => set({ replyingTo: message }),

    loadHistory: async () => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        set({ loading: true });

        try {
            const result = await syncCacheFirst<readonly RawChatMessage[]>({
                context,
                resource: 'chat',
                path: '/chat/history',
                params: { limit: 50 },
                ttlMs: CACHE_TTL_MS.chat,
                incremental: { merge: mergeChatHistory },
                onData: (data) => {
                    set({ messages: data.map(normalizeChatMessage) });
                }
            });
            const hydrated = await hydrateMedia(result.data.map(normalizeChatMessage));
            set({ messages: hydrated });
        } finally {
            set({ loading: false });
        }
    },

    fetchDirectory: async () => {
        const response = await choirApi.get<ChatDirectoryResponse>('/users/directory');
        set({ allUsers: [...response.data.users] });
    },

    connect: () => {
        const { token, user, requiresPasswordChange } = useAuthStore.getState();
        const targetChoirId = useTargetChoirStore.getState().selectedChoir?.id ?? null;
        const existing = get().socket;

        if (
            !token ||
            !user ||
            requiresPasswordChange ||
            existing?.connected ||
            (user.role === 'SUPER_ADMIN' && !targetChoirId)
        ) {
            return;
        }

        disconnectSocket(existing);

        const socketAuth = user.role === 'SUPER_ADMIN'
            ? { accessToken: token, targetChoirId }
            : { accessToken: token };
        const socket: ChoirSocket = io(ENV.SOCKET_URL, {
            auth: socketAuth,
            transports: ['websocket', 'polling'],
            tryAllTransports: true,
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1_000,
            reconnectionDelayMax: 10_000,
            timeout: 12_000,
            forceNew: true
        });

        socket.on('connect', () => set({
            connected: true,
            connectionError: null
        }));
        socket.on('connect_error', (error: Error) => set({
            connected: false,
            connectionError: error.message || 'No fue posible conectar el chat'
        }));
        socket.on('disconnect', (reason, details) => {
            const disconnectDetails = details
                ? details instanceof Error
                    ? details.message
                    : details.description
                : undefined;

            console.warn('Socket disconnected', {
                reason,
                details: disconnectDetails
            });

            set({
                connected: false
            });
        });
        socket.on('new-message', (raw) => {
            persistChatChanges([raw]).catch(() => undefined);
            const normalized = normalizeChatMessage(raw);
            hydrateMedia([normalized])
                .then(([hydrated]) => set((state) => ({
                    messages: addOrReplaceMessage(state.messages, hydrated)
                })))
                .catch(() => set((state) => ({
                    messages: addOrReplaceMessage(state.messages, normalized)
                })));
        });
        socket.on('message-updated', (raw) => {
            persistChatChanges([raw]).catch(() => undefined);
            const normalized = normalizeChatMessage(raw);
            set((state) => ({ messages: addOrReplaceMessage(state.messages, normalized) }));
        });
        socket.on('online-users', (users) => set({ onlineUsers: users }));
        socket.on('user-typing', ({ username, isTyping }: SocketTypingEvent) => set((state) => ({
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
    },

    disconnect: () => {
        disconnectSocket(get().socket);
        set({
            connected: false,
            connectionError: null,
            socket: null,
            onlineUsers: [],
            typingUsers: []
        });
    },

    sendTyping: (isTyping) => {
        get().socket?.emit('typing', isTyping);
    },

    reactToMessage: async (messageId, emoji) => {
        const updated = await toggleReaction(messageId, emoji);
        await persistChatChanges([toRawChatMessage(updated)]);
        set((state) => ({ messages: addOrReplaceMessage(state.messages, updated) }));
    },

    sendMessage: async (textInput, attachment) => {
        const replyingTo = get().replyingTo;
        const trimmed = textInput.trim();

        if (!attachment && trimmed.length === 0) {
            return;
        }

        get().sendTyping(false);
        const upload = attachment
            ? await uploadChatMedia(attachment)
            : null;
        const message = await sendChatMessage({
            content: trimmed,
            type: attachment ? mapAttachmentType(attachment.type) : 'TEXT',
            mediaAssetId: upload?.assetId,
            replyTo: replyingTo?.id
        });
        await persistChatChanges([toRawChatMessage(message)]);
        const [hydrated] = await hydrateMedia([message]);

        set((state) => ({
            messages: addOrReplaceMessage(state.messages, hydrated),
            replyingTo: null
        }));
    },

    reset: () => {
        get().disconnect();
        set({
            messages: [],
            connected: false,
            connectionError: null,
            socket: null,
            replyingTo: null,
            loading: false,
            onlineUsers: [],
            allUsers: [],
            typingUsers: []
        });
    }
}));
