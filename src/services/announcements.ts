import choirApi from '../api/choirApi';
import { Platform } from 'react-native';

// --- Helper to build the "String Wrapper" FormData ---
const createFormData = (payload: any, imageUri?: string) => {
    const formData = new FormData();
    
    // 1. The JSON Data as a String (Crucial fix for backend)
    formData.append('data', JSON.stringify(payload));

    // 2. The File (if exists)
    if (imageUri) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            // Web fix handled by the component fetching blob usually, 
            // or if you just pass the uri, we can try to append it directly if supported,
            // but for now let's assume standard RN behavior or you have the web blob logic.
            // Simplified for RN:
            // @ts-ignore
            formData.append('file', imageUri); 
        } else {
            // Mobile
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

export const getAnnouncements = async (isAdmin: boolean) => {
    const endpoint = isAdmin ? '/announcements/admin' : '/announcements/public';
    const { data } = await choirApi.get(endpoint);
    return data;
};

export const createAnnouncement = async (title: string, content: any, isPublic: boolean, imageUri?: string) => {
    const payload = { title, content, isPublic };
    const formData = createFormData(payload, imageUri);

    const { data } = await choirApi.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateAnnouncement = async (id: number, title: string, content: any, isPublic: boolean, imageUri?: string) => {
    const payload = { title, content, isPublic };
    const formData = createFormData(payload, imageUri);

    const { data } = await choirApi.put(`/announcements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const deleteAnnouncement = async (id: number) => {
    await choirApi.delete(`/announcements/${id}`);
};