import choirApi from '../api/choirApi';
import type { Announcement } from '../types/announcement';
import { Platform } from 'react-native';

// Helper type for creating/updating
export interface AnnouncementPayload {
    title: string;
    textContent: string; // Raw text
    imageUri?: string;   // Local path
    isPublic: boolean;
}

// 1. Public Read
export const getPublicAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements');
    return data;
};

// 2. Admin Read (Includes Drafts)
export const getAdminAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements/admin');
    return data;
};

// 3. Create
export const createAnnouncement = async (payload: AnnouncementPayload): Promise<Announcement> => {
    const formData = buildFormData(payload); // Refactored helper below
    const { data } = await choirApi.post<Announcement>('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

// 4. Update
export const updateAnnouncement = async (id: number, payload: AnnouncementPayload): Promise<Announcement> => {
    const formData = buildFormData(payload);
    const { data } = await choirApi.put<Announcement>(`/announcements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

// 5. Delete
export const deleteAnnouncement = async (id: number): Promise<void> => {
    await choirApi.delete(`/announcements/${id}`);
};

// --- Helper to build FormData (DRY Principle) ---
const buildFormData = (payload: AnnouncementPayload): FormData => {
    const formData = new FormData();

    // Construct JSONB structure
    const richTextContent = {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: payload.textContent }]
            }
        ]
    };

    const dto = {
        title: payload.title,
        isPublic: payload.isPublic,
        content: richTextContent
    };

    formData.append('data', JSON.stringify(dto));

    if (payload.imageUri && !payload.imageUri.startsWith('http')) {
        const filename = payload.imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'android' ? payload.imageUri : payload.imageUri.replace('file://', ''),
            name: filename,
            type: type,
        });
    }

    return formData;
};