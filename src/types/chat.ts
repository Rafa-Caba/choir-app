// src/types/chat.ts

import type { JsonValue } from './json';

export interface ChatUserSummary {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl?: string;
}

export type MessageType =
    | 'TEXT'
    | 'IMAGE'
    | 'FILE'
    | 'MEDIA'
    | 'REACTION'
    | 'AUDIO'
    | 'VIDEO'
    | 'STICKER';

export type ChatReceiptStatus = 'DELIVERED' | 'READ';

export interface MessageReaction {
    readonly emoji: string;
    readonly user: ChatUserSummary | string;
    readonly username?: string;
}

export interface ReplyPreview {
    readonly id: string;
    readonly username: string;
    readonly textPreview: string;
}

export interface ChatMessage {
    readonly id: string;
    readonly author: ChatUserSummary;
    readonly content: JsonValue;
    readonly type: MessageType;
    readonly fileUrl?: string;
    readonly filename?: string;
    readonly imageUrl?: string;
    readonly audioUrl?: string;
    readonly imagePublicId?: string;
    readonly cachedMediaUrl?: string | null;
    readonly reactions: readonly MessageReaction[];
    readonly replyTo?: ReplyPreview | null;
    readonly deliveredTo: readonly string[];
    readonly readBy: readonly string[];
    readonly createdAt: string;
    readonly updatedAt?: string;
}

export interface RawChatUser {
    readonly id?: string;
    readonly _id?: string;
    readonly name?: string;
    readonly username?: string;
    readonly imageUrl?: string;
}

export interface RawReaction {
    readonly emoji?: string;
    readonly user?: RawChatUser | string;
    readonly username?: string;
}

export interface RawReplyMessage {
    readonly id?: string;
    readonly _id?: string;
    readonly content?: JsonValue;
    readonly author?: RawChatUser;
}

export interface RawReceiptUser {
    readonly id?: string;
    readonly _id?: string;
}

export type RawReceiptValue = string | RawReceiptUser;

export interface RawChatMessage {
    readonly id?: string;
    readonly _id?: string;
    readonly author?: RawChatUser;
    readonly content?: JsonValue;
    readonly type?: MessageType;
    readonly fileUrl?: string;
    readonly filename?: string;
    readonly imageUrl?: string;
    readonly audioUrl?: string;
    readonly imagePublicId?: string;
    readonly reactions?: readonly RawReaction[];
    readonly replyTo?: RawReplyMessage | null;
    readonly deliveredTo?: readonly RawReceiptValue[];
    readonly readBy?: readonly RawReceiptValue[];
    readonly createdAt?: string;
    readonly updatedAt?: string;
}

export interface NewMessagePayload {
    readonly content: JsonValue;
    readonly type: MessageType;
    readonly mediaAssetId?: string;
    readonly replyTo?: string;
}

export interface ChatUploadResponse {
    readonly assetId: string;
    readonly fileUrl: string;
    readonly filename: string;
    readonly resourceType: string;
}

export interface ChatMessageResponse {
    readonly message: RawChatMessage;
}

export interface ChatReceiptsResponse {
    readonly messages: readonly RawChatMessage[];
}

export interface SocketPresenceUser extends ChatUserSummary {
    readonly role: string;
    readonly choirId: string;
    readonly connectionCount: number;
}

export interface SocketTypingEvent {
    readonly userId: string;
    readonly username: string;
    readonly isTyping: boolean;
}

export interface SocketDisconnectNotice {
    readonly code: string;
    readonly message: string;
}
