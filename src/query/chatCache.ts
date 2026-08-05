// src/query/chatCache.ts

import type { ChatMessage } from '../types/chat';

export const upsertChatMessage = (
    messages: readonly ChatMessage[] | undefined,
    incoming: ChatMessage
): readonly ChatMessage[] => {
    const current = messages ?? [];
    const exists = current.some((message) => message.id === incoming.id);

    if (exists) {
        return current.map((message) => message.id === incoming.id ? incoming : message);
    }

    return [...current, incoming];
};
