import choirApi from '../api/choirApi';
import { Platform } from 'react-native';
import type { ChatMessage, ReplyPreview, MessageType } from '../types/chat';


export const normalizeChatMessage = (raw: any): ChatMessage => {
    const rawAuthor: any = raw.author || {};
    const author: any = {
        id: (rawAuthor.id || rawAuthor._id || '').toString(),
        name: rawAuthor.name || 'Usuario',
        username: rawAuthor.username || 'usuario',
        imageUrl: rawAuthor.imageUrl || '',
    };

    let replyTo: ReplyPreview | undefined;
    const rawReply: any = raw.replyTo;

    if (rawReply && typeof rawReply === 'object') {
        if ('textPreview' in rawReply || 'username' in rawReply) {
            replyTo = {
                id: (rawReply.id || rawReply._id || '').toString(),
                username: rawReply.username || 'Usuario',
                textPreview: rawReply.textPreview || '',
            };
        } else {
            const rawReplyAuthor: any = rawReply.author || {};

            const replyId = (rawReply.id || rawReply._id || '').toString();
            const replyUsername =
                rawReplyAuthor.username ||
                rawReplyAuthor.name ||
                'Usuario';

            let textPreview = '';

            if (typeof rawReply.content === 'string') {
                textPreview = rawReply.content;
            } else if (rawReply.content && typeof rawReply.content === 'object') {
                textPreview =
                    rawReply.content.text ||
                    (Array.isArray(rawReply.content.content) && rawReply.content.content[0]?.text) ||
                    '[mensaje]';
            } else {
                textPreview = '[mensaje]';
            }

            replyTo = {
                id: replyId,
                username: replyUsername,
                textPreview,
            };
        }
    }

    const message: ChatMessage = {
        id: (raw.id || raw._id || '').toString(),
        author,
        content: raw.content,
        type: raw.type as MessageType,
        fileUrl: raw.fileUrl || '',
        filename: raw.filename || '',
        imageUrl: raw.imageUrl,
        audioUrl: raw.audioUrl,
        reactions: raw.reactions || [],
        replyTo,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };

    return message;
};

// Helper: Async FormData
const createChatFormData = async (fileUri: string, type: 'image' | 'video' | 'audio' | 'file') => {
    const formData = new FormData();

    let filename = 'upload';
    let mimeType = 'application/octet-stream';

    if (fileUri.startsWith('data:')) {
        const mimeMatch = fileUri.match(/^data:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
    }

    if (type === 'image') {
        mimeType = 'image/jpeg';
        filename += '.jpg';
    } else if (type === 'video') {
        mimeType = 'video/mp4';
        filename += '.mp4';
    } else if (type === 'audio') {
        mimeType = 'audio/m4a';
        filename += '.m4a';
    } else if (type === 'file') {
        if (mimeType.includes('pdf')) filename += '.pdf';
        else if (mimeType.includes('text')) filename += '.txt';
        else if (mimeType.includes('word')) filename += '.docx';
        else if (mimeType.includes('sheet') || mimeType.includes('excel')) filename += '.xlsx';
        else if (mimeType.includes('zip')) filename += '.zip';
        else filename += '.bin';
    }

    if (Platform.OS === 'web') {
        try {
            const response = await fetch(fileUri);
            const originalBlob = await response.blob();
            const blob = originalBlob.slice(0, originalBlob.size, mimeType);
            // @ts-ignore
            formData.append('file', blob, filename);
        } catch (e) {
            console.error('Web Blob Error:', e);
        }
    } else {
        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
            name: filename,
            type: mimeType,
        });
    }

    return formData;
};

// GET HISTORY
export const getChatHistory = async (limit = 50): Promise<ChatMessage[]> => {
    const { data } = await choirApi.get<any[]>(`/chat/history?limit=${limit}`);
    return data.map(normalizeChatMessage);
};

// UPLOAD
export const uploadChatMedia = async (uri: string, type: 'image' | 'video' | 'audio' | 'file') => {
    const formData = await createChatFormData(uri, type);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    let endpoint = '/chat/upload-file';
    if (type === 'image') endpoint = '/chat/upload-image';
    else if (type === 'video' || type === 'audio') endpoint = '/chat/upload-media';

    console.log(`📤 Uploading ${type} to ${endpoint}`);

    const { data } = await choirApi.post(endpoint, formData, requestConfig);

    const msg = data.message;
    return msg?.fileUrl || msg?.imageUrl || msg?.audioUrl || data.url || "";
};

// SEND TEXT
export const sendTextMessage = async (payload: {
    content: string;
    type: MessageType;
    fileUrl?: string;
    filename?: string;
    replyToId?: string;
}): Promise<ChatMessage> => {
    const { data } = await choirApi.post<{ message: any }>('/chat', payload);
    return normalizeChatMessage(data.message);
};

// REACTIONS
export const toggleReaction = async (messageId: string, emoji: string): Promise<ChatMessage> => {
    const { data } = await choirApi.patch<{ message: any }>(`/chat/${messageId}/reaction`, { emoji });
    return normalizeChatMessage(data.message);
};
