import choirApi from '../api/choirApi';
import { Platform } from 'react-native';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';

// Helper: Async FormData
const createFormData = async (payload: any, imageUri?: string) => {
    const formData = new FormData();

    const { imageUri: _, ...dataPayload } = payload;

    // Map to Backend Keys
    const finalPayload = {
        title: dataPayload.title,
        content: dataPayload.content,
        isPublic: dataPayload.isPublic
    };

    formData.append('data', JSON.stringify(finalPayload));

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = 'cover.jpg';
        const type = 'image/jpeg';

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } catch (e) { console.error(e); }
        } else {
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

// GET Public
export const getPublicAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements/public');
    return data;
};

// GET Admin
export const getAdminAnnouncements = async (): Promise<Announcement[]> => {
    const { data } = await choirApi.get<Announcement[]>('/announcements/admin');
    return data;
};

// CREATE
export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<Announcement> => {
    const formData = await createFormData(payload, payload.imageUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    const { data } = await choirApi.post<Announcement>('/announcements', formData, requestConfig);
    return data;
};

// UPDATE
export const updateAnnouncement = async (id: string, payload: Partial<CreateAnnouncementPayload>): Promise<Announcement> => {
    const formData = await createFormData(payload, payload.imageUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    const { data } = await choirApi.put<Announcement>(`/announcements/${id}`, formData, requestConfig);
    return data;
};

// DELETE
export const deleteAnnouncement = async (id: string): Promise<void> => {
    await choirApi.delete(`/announcements/${id}`);
};