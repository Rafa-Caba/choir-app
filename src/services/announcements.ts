import choirApi from '../api/choirApi';
import { Platform } from 'react-native';

export interface AnnouncementPayload {
    title: string;
    content: any;
    isPublic: boolean;
    imageUri?: string;
}

// --- Helper to build the "String Wrapper" FormData ---
const createFormData = async (payload: any, imageUri?: string) => {
    const formData = new FormData();
    
    // 1. Append JSON
    // Ensure content is never undefined to prevent it being stripped
    const safePayload = {
        ...payload,
        content: payload.content || { type: 'doc', content: [] } // Default empty rich text
    };
    formData.append('data', JSON.stringify(safePayload));

    // 2. Append File
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            // 🌍 WEB FIX: Fetch the URI and convert to Blob
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } catch (e) {
                console.error("Failed to process image for web", e);
            }
        } else {
            // 📱 MOBILE: Standard React Native Polyfill
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    return formData;
};

// --- API Calls ---

export const getPublicAnnouncements = async () => {
    const { data } = await choirApi.get('/announcements/public');
    return data;
};

export const getAdminAnnouncements = async () => {
    const { data } = await choirApi.get('/announcements/admin');
    return data;
};

export const createAnnouncement = async (title: string, content: any, isPublic: boolean, imageUri?: string) => {
    // For Create, we pass everything
    const payload = { title, content, isPublic };
    console.log({ title, content, isPublic, imageUri });
    
    const formData = await createFormData(payload, imageUri);

    const { data } = await choirApi.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateAnnouncement = async (id: number, title: string, content: any, isPublic: boolean, imageUri?: string) => {
    // For Update, createFormData handles filtering out existing HTTP urls
    const payload = { title, content, isPublic };
    const formData = await createFormData(payload, imageUri);

    const { data } = await choirApi.put(`/announcements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteAnnouncement = async (id: number) => {
    await choirApi.delete(`/announcements/${id}`);
};