import choirApi from '../api/choirApi';
import { Platform } from 'react-native';
import type { ChatMessage } from '../types/chat';

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
            formData.append('file', blob, filename);
        } catch (e) {
            console.error("Web Blob Error:", e);
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
    const { data } = await choirApi.get<ChatMessage[]>(`/chat/history?limit=${limit}`);
    return data;
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
export const sendTextMessage = async (content: any): Promise<ChatMessage> => {
    const { data } = await choirApi.post<ChatMessage>('/chat', {
        content,
        type: 'TEXT'
    });
    return data;
};

// 🆕 TOGGLE REACTION
export const toggleReaction = async (messageId: string, emoji: string): Promise<ChatMessage> => {
    const { data } = await choirApi.patch<{ message: ChatMessage }>(`/chat/${messageId}/reaction`, { emoji });
    return data.message;
};