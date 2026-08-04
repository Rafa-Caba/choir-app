// src/services/announcement.ts

import choirApi from '../api/choirApi';
import type { Announcement, CreateAnnouncementPayload } from '../types/announcement';
import {
    appendLocalFile,
    createLocalUpload,
    getMultipartRequestConfig
} from './multipart';

const createAnnouncementFormData = async (
    payload: Partial<CreateAnnouncementPayload>
): Promise<FormData> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
        title: payload.title,
        content: payload.content,
        isPublic: payload.isPublic
    }));

    if (payload.imageUri && !payload.imageUri.startsWith('http')) {
        await appendLocalFile(
            formData,
            'file',
            createLocalUpload(payload.imageUri, 'announcement-cover.jpg', 'image/jpeg')
        );
    }

    return formData;
};

export const getAnnouncements = async (): Promise<readonly Announcement[]> => {
    const response = await choirApi.get<readonly Announcement[]>('/announcements');
    return response.data;
};

export const createAnnouncement = async (
    payload: CreateAnnouncementPayload
): Promise<Announcement> => {
    const formData = await createAnnouncementFormData(payload);
    const response = await choirApi.post<Announcement>(
        '/announcements',
        formData,
        getMultipartRequestConfig()
    );
    return response.data;
};

export const updateAnnouncement = async (
    id: string,
    payload: Partial<CreateAnnouncementPayload>
): Promise<Announcement> => {
    const formData = await createAnnouncementFormData(payload);
    const response = await choirApi.put<Announcement>(
        `/announcements/${id}`,
        formData,
        getMultipartRequestConfig()
    );
    return response.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
    await choirApi.delete(`/announcements/${id}`);
};
