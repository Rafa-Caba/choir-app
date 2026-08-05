// src/services/chat.ts

import choirApi from '../api/choirApi';
import type {
    ChatMessage,
    ChatMessageResponse,
    ChatUploadResponse,
    NewMessagePayload,
    RawChatMessage
} from '../types/chat';
import { normalizeChatMessage } from '../utils/normalizeChatMessage';
import {
    appendLocalFile,
    createLocalUpload,
    getMultipartRequestConfig
} from './multipart';

export type ChatAttachmentType = 'image' | 'video' | 'audio' | 'file';

const CHAT_UPLOAD_TIMEOUT_MS = 90_000;

export interface ChatAttachment {
    readonly uri: string;
    readonly type: ChatAttachmentType;
    readonly filename: string;
    readonly mimeType: string;
}

const fallbackAttachmentMetadata = (
    type: ChatAttachmentType
): { readonly filename: string; readonly mimeType: string } => {
    switch (type) {
        case 'image':
            return { filename: 'chat-image.jpg', mimeType: 'image/jpeg' };
        case 'video':
            return { filename: 'chat-video.mp4', mimeType: 'video/mp4' };
        case 'audio':
            return { filename: 'chat-audio.m4a', mimeType: 'audio/mp4' };
        case 'file':
            return { filename: 'chat-file.pdf', mimeType: 'application/pdf' };
    }
};

export const getChatHistory = async (
    limit = 50,
    signal?: AbortSignal
): Promise<readonly RawChatMessage[]> => {
    const response = await choirApi.get<readonly RawChatMessage[]>('/chat/history', {
        params: { limit },
        signal
    });
    return response.data;
};

export const uploadChatMedia = async (
    attachment: ChatAttachment
): Promise<ChatUploadResponse> => {
    const formData = new FormData();
    const fallback = fallbackAttachmentMetadata(attachment.type);
    const upload = createLocalUpload(
        attachment.uri,
        attachment.filename || fallback.filename,
        attachment.mimeType || fallback.mimeType
    );
    await appendLocalFile(formData, 'file', upload);

    const endpoint = attachment.type === 'image'
        ? '/chat/upload-image'
        : attachment.type === 'file'
            ? '/chat/upload-file'
            : '/chat/upload-media';
    const response = await choirApi.post<ChatUploadResponse>(
        endpoint,
        formData,
        {
            ...getMultipartRequestConfig(),
            timeout: CHAT_UPLOAD_TIMEOUT_MS
        }
    );
    return response.data;
};

export const sendChatMessage = async (
    payload: NewMessagePayload
): Promise<ChatMessage> => {
    const response = await choirApi.post<ChatMessageResponse>('/chat', payload);
    return normalizeChatMessage(response.data.message);
};

export const toggleReaction = async (
    messageId: string,
    emoji: string
): Promise<ChatMessage> => {
    const response = await choirApi.patch<ChatMessageResponse>(
        `/chat/${messageId}/reaction`,
        { emoji }
    );
    return normalizeChatMessage(response.data.message);
};
