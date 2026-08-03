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
import { appendLocalFile, getMultipartRequestConfig } from './multipart';

export type ChatAttachmentType = 'image' | 'video' | 'audio' | 'file';

const getAttachmentMetadata = (
    uri: string,
    type: ChatAttachmentType
): { readonly filename: string; readonly mimeType: string } => {
    const existingName = uri.split('?')[0].split('/').pop();

    switch (type) {
        case 'image':
            return { filename: existingName ?? 'chat-image.jpg', mimeType: 'image/jpeg' };
        case 'video':
            return { filename: existingName ?? 'chat-video.mp4', mimeType: 'video/mp4' };
        case 'audio':
            return { filename: existingName ?? 'chat-audio.m4a', mimeType: 'audio/m4a' };
        case 'file':
            return { filename: existingName ?? 'chat-file.bin', mimeType: 'application/octet-stream' };
    }
};

export const getChatHistory = async (limit = 50): Promise<readonly RawChatMessage[]> => {
    const response = await choirApi.get<readonly RawChatMessage[]>('/chat/history', {
        params: { limit }
    });
    return response.data;
};

export const uploadChatMedia = async (
    uri: string,
    type: ChatAttachmentType
): Promise<ChatUploadResponse> => {
    const formData = new FormData();
    const metadata = getAttachmentMetadata(uri, type);
    await appendLocalFile(formData, 'file', { uri, ...metadata });

    const endpoint = type === 'image'
        ? '/chat/upload-image'
        : type === 'file'
            ? '/chat/upload-file'
            : '/chat/upload-media';
    const response = await choirApi.post<ChatUploadResponse>(
        endpoint,
        formData,
        getMultipartRequestConfig()
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
