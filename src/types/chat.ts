import type { User } from './auth';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'MEDIA' | 'REACTION' | 'AUDIO';

export interface MessageReaction {
    emoji: string;
    username: string;
}

export interface ChatMessage {
    id: number;
    author: User;
    // This matches the JSONB content from Spring
    content: { 
        type: string;
        content?: any[];
    };
    type: MessageType;
    
    // Media fields
    fileUrl?: string;
    filename?: string;
    imageUrl?: string;
    imagePublicId?: string;
    audioUrl?: string;
    
    // Reactions (Now fully typed)
    reactions: MessageReaction[];
    
    replyTo?: ReplyPreview;

    createdAt: string;
}

// Payload for sending a new message via WebSocket
export interface NewMessagePayload {
    username: string; // Backend looks up user by this string
    content: any;     // Rich Text JSON
    type: MessageType;
    
    // Optional media fields
    fileUrl?: string;
    filename?: string;
    imageUrl?: string;
    imagePublicId?: string;
    audioUrl?: string;
    audioPublicId?: string;

    replyToId?: number;
}

export interface ReplyPreview {
    id: number;
    username: string;
    textPreview: string;
}