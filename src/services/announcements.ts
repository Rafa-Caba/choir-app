import { Platform } from 'react-native';
import choirApi from '../api/choirApi';
import type { Announcement } from '../types/announcement';

export interface AnnouncementPayload {
    title: string;
    textContent: string;
    imageUri?: string;
    isPublic: boolean;
}

export const getPublicAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements');
    return data;
};

export const getAdminAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements/admin');
    return data;
};

// --- HELPER FOR FORM DATA & HEADERS ---
const prepareRequest = async (payload: AnnouncementPayload) => {
    const formData = new FormData();

    // 1. JSON Part
    const richTextContent = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: payload.textContent }] }]
    };
    const dto = { title: payload.title, isPublic: payload.isPublic, content: richTextContent };
    
    // Web Blob Fix
    formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    // 2. Image Part
    if (payload.imageUri && !payload.imageUri.startsWith('http')) {
        const filename = payload.imageUri.split('/').pop() || 'img.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            const response = await fetch(payload.imageUri);
            const blob = await response.blob();
            formData.append('file', blob, filename);
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? payload.imageUri : payload.imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    // 3. Headers Config
    const config: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };
    if (Platform.OS === 'web') {
        config.headers['Content-Type'] = undefined; // Let browser set boundary
    }

    return { formData, config };
};

export const createAnnouncement = async (payload: AnnouncementPayload): Promise<Announcement> => {
    const { formData, config } = await prepareRequest(payload);
    const { data } = await choirApi.post<Announcement>('/announcements', formData, config);
    return data;
};

export const updateAnnouncement = async (id: number, payload: AnnouncementPayload): Promise<Announcement> => {
    const { formData, config } = await prepareRequest(payload);
    const { data } = await choirApi.put<Announcement>(`/announcements/${id}`, formData, config);
    return data;
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
    await choirApi.delete(`/announcements/${id}`);
};