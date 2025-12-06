import type { User } from './auth';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'MEDIA' | 'REACTION' | 'AUDIO' | 'VIDEO';

export interface MessageReaction {
    emoji: string;
    user: User | string;
    username?: string;
}

export interface ChatMessage {
    id: string;
    author: User;

    content: any;

    type: MessageType;
    fileUrl?: string;
    filename?: string;
    imageUrl?: string;
    audioUrl?: string;
    imagePublicId?: string;

    reactions: MessageReaction[];

    replyTo?: ReplyPreview;

    createdAt: string;
    updatedAt?: string;
}

export interface NewMessagePayload {
    username: string;
    content: any;
    type: MessageType;

    fileUrl?: string;
    filename?: string;
    imageUrl?: string;
    audioUrl?: string;

    replyToId?: string;
}

export interface ReplyPreview {
    id: string;
    username: string;
    textPreview: string;
}