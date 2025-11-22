import choirApi from '../api/choirApi';
import type { ChatMessage } from '../types/chat';

// GET /api/chat/history
export const getChatHistory = async (): Promise<ChatMessage[]> => {
    const { data } = await choirApi.get<ChatMessage[]>('/chat/history');
    return data;
};

// POST /api/chat/upload (Multipart)
// Returns { url: string, publicId: string }
export const uploadChatImage = async (uri: string): Promise<{ url: string, publicId: string }> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // @ts-ignore
    formData.append('file', {
        uri: uri, // Platform specific adjustment handled in component/utils usually, or here if you import Platform
        name: filename,
        type: type,
    });

    const { data } = await choirApi.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};