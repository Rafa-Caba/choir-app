// src/services/admin/settings.ts

import choirApi from '../../api/choirApi';
import type { AppSettings, UpdateSettingsPayload } from '../../types/settings';
import { appendLocalFile, getMultipartRequestConfig } from '../multipart';

export const getSettings = async (): Promise<AppSettings> => {
    const response = await choirApi.get<AppSettings>('/settings');
    return response.data;
};

export const updateSettings = async (
    settings: UpdateSettingsPayload,
    logoUri?: string
): Promise<AppSettings> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(settings));

    if (logoUri && !logoUri.startsWith('http')) {
        await appendLocalFile(formData, 'file', {
            uri: logoUri,
            filename: 'choir-logo.jpg',
            mimeType: 'image/jpeg'
        });
    }

    const response = await choirApi.put<AppSettings>(
        '/settings',
        formData,
        getMultipartRequestConfig()
    );
    return response.data;
};
