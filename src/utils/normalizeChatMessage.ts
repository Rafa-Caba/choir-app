// src/utils/normalizeChatMessage.ts

import type {
    ChatMessage,
    ChatUserSummary,
    MessageReaction,
    RawChatMessage,
    RawChatUser,
    RawReceiptValue,
    ReplyPreview
} from '../types/chat';

const normalizeUser = (rawUser?: RawChatUser): ChatUserSummary => ({
    id: rawUser?.id ?? rawUser?._id ?? '',
    name: rawUser?.name ?? 'Usuario',
    username: rawUser?.username ?? 'usuario',
    imageUrl: rawUser?.imageUrl
});

const normalizeReactionUser = (rawUser: RawChatUser | string | undefined): ChatUserSummary | string => {
    if (typeof rawUser === 'string') {
        return rawUser;
    }

    return normalizeUser(rawUser);
};

const normalizeReceiptId = (value: RawReceiptValue): string => {
    if (typeof value === 'string') {
        return value;
    }

    return value.id ?? value._id ?? '';
};

const normalizeReceiptIds = (values?: readonly RawReceiptValue[]): readonly string[] => {
    return [...new Set((values ?? []).map(normalizeReceiptId).filter(Boolean))];
};

const normalizeReply = (raw: RawChatMessage['replyTo']): ReplyPreview | null => {
    if (!raw) {
        return null;
    }

    const textPreview = typeof raw.content === 'string'
        ? raw.content
        : 'Mensaje';

    return {
        id: raw.id ?? raw._id ?? '',
        username: raw.author?.username ?? 'usuario',
        textPreview
    };
};

export const normalizeChatMessage = (raw: RawChatMessage): ChatMessage => {
    const createdAt = raw.createdAt ?? new Date().toISOString();
    const reactions: readonly MessageReaction[] = (raw.reactions ?? []).map((reaction) => ({
        emoji: reaction.emoji ?? '',
        user: normalizeReactionUser(reaction.user),
        username: reaction.username
    }));

    return {
        id: raw.id ?? raw._id ?? '',
        author: normalizeUser(raw.author),
        content: raw.content ?? '',
        type: raw.type ?? 'TEXT',
        fileUrl: raw.fileUrl,
        filename: raw.filename,
        imageUrl: raw.imageUrl,
        audioUrl: raw.audioUrl,
        imagePublicId: raw.imagePublicId,
        reactions,
        replyTo: normalizeReply(raw.replyTo),
        deliveredTo: normalizeReceiptIds(raw.deliveredTo),
        readBy: normalizeReceiptIds(raw.readBy),
        createdAt,
        updatedAt: raw.updatedAt ?? createdAt
    };
};
