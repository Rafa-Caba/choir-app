// rn/utils/normalizeChatMessage.ts
import type { ChatMessage, ChatUserSummary, MessageType } from '../types/chat';

export const normalizeChatMessage = (raw: any): ChatMessage => {
    const candidate = raw?.text && raw.text.author ? raw.text : raw;
    const base = candidate ?? {};

    const rawAuthor: any = base.author || {};
    const author: ChatUserSummary = {
        id: (rawAuthor.id || rawAuthor._id || '').toString(),
        name: rawAuthor.name || 'Usuario',
        username: rawAuthor.username || 'usuario',
        imageUrl: rawAuthor.imageUrl || '',
    };

    const id = (base.id || base._id || '').toString();
    const createdAt = base.createdAt || new Date().toISOString();
    const updatedAt = base.updatedAt || createdAt;

    const message: ChatMessage = {
        id,
        author,
        content: base.content,
        type: (base.type || 'TEXT') as MessageType,

        fileUrl: base.fileUrl || '',
        filename: base.filename || '',
        imageUrl: base.imageUrl,
        audioUrl: base.audioUrl,
        imagePublicId: base.imagePublicId,

        reactions: base.reactions || [],

        replyTo: base.replyTo ?? null,

        createdAt,
        updatedAt,
    };

    return message;
};
