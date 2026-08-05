// src/utils/normalizeChatMessage.ts

import type {
    ChatMessage,
    ChatUserSummary,
    MessageReaction,
    MessageType,
    RawChatMessage,
    RawChatUser,
    RawReceiptValue,
    RawReplyMessage,
    ReplyPreview
} from '../types/chat';
import { getPreviewFromRichText } from './textUtils';

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

const getReplyTypePreview = (type: MessageType | undefined, filename?: string): string => {
    switch (type) {
        case 'IMAGE':
            return '📷 Foto';
        case 'VIDEO':
        case 'MEDIA':
            return '🎥 Video';
        case 'AUDIO':
            return '🎤 Nota de voz';
        case 'FILE':
            return filename ? `📎 ${filename}` : '📎 Archivo';
        case 'STICKER':
            return '✨ Sticker';
        default:
            return 'Mensaje original';
    }
};

const getReplyTextPreview = (raw: RawReplyMessage): string => {
    const contentPreview = getPreviewFromRichText(raw.content ?? '').trim();

    if (contentPreview) {
        return contentPreview;
    }

    return getReplyTypePreview(raw.type, raw.filename);
};

const normalizeReply = (raw: RawChatMessage['replyTo']): ReplyPreview | null => {
    if (!raw) {
        return null;
    }

    if (typeof raw === 'string') {
        return {
            id: raw,
            authorName: 'Mensaje original',
            username: 'usuario',
            textPreview: 'Mensaje original'
        };
    }

    const author = normalizeUser(raw.author);

    return {
        id: raw.id ?? raw._id ?? '',
        authorName: author.name,
        username: author.username,
        textPreview: getReplyTextPreview(raw)
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
