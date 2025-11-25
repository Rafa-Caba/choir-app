import choirApi from '../api/choirApi';
import type { ChatMessage } from '../types/chat';
import { Platform } from 'react-native';

// GET /api/chat/history
export const getChatHistory = async (): Promise<ChatMessage[]> => {
    const { data } = await choirApi.get<ChatMessage[]>('/chat/history');
    return data;
};

// POST /api/chat/upload
// Handles both Images and Audio
export const uploadChatMedia = async (uri: string): Promise<{ url: string, publicId: string }> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload';
    
    // --- MIME TYPE DETECTION ---
    let type = 'image/jpeg'; // Default
    const ext = filename.split('.').pop()?.toLowerCase();

    // Image formats
    if (ext === 'png') type = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
    else if (ext === 'gif') type = 'image/gif';
    
    // Audio formats (Expo AV usually records to .m4a or .caf on iOS, .3gp or .m4a on Android)
    else if (ext === 'm4a') type = 'audio/m4a';
    else if (ext === 'mp4') type = 'audio/mp4'; // Android sometimes treats audio as mp4 container
    else if (ext === '3gp') type = 'audio/3gpp';
    else if (ext === 'caf') type = 'audio/x-caf';
    else if (ext === 'wav') type = 'audio/wav';

    // Construct FormData
    // @ts-ignore
    formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type: type, // <--- Sent to backend
    });

    // Cloudinary service on backend is set to "resource_type: auto", so it will adapt
    const { data } = await choirApi.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};