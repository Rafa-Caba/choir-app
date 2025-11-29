import choirApi from '../../api/choirApi';
import { Platform } from 'react-native';
import type { AppSettings, UpdateSettingsPayload } from '../../types/settings';

// Helper: Async FormData Builder
const createFormData = async (payload: any, imageUri?: string) => {
    const formData = new FormData();

    // Append JSON data
    // Backend expects the body to be parsed from 'data'
    formData.append('data', JSON.stringify(payload));

    // Append File (Logo)
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = 'logo.jpg';
        const type = 'image/jpeg';

        if (Platform.OS === 'web') {
            // 🌍 WEB FIX: Fetch blob
            if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
                try {
                    const response = await fetch(imageUri);
                    const blob = await response.blob();
                    formData.append('file', blob, filename);
                } catch (e) { console.error("Web Blob Error:", e); }
            }
        } else {
            // 📱 MOBILE FIX
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

export const getSettings = async (): Promise<AppSettings> => {
    // Matches Backend: GET /api/settings
    const { data } = await choirApi.get<AppSettings>('/settings');
    return data;
};

export const updateSettings = async (settings: UpdateSettingsPayload, logoUri?: string): Promise<AppSettings> => {
    // ⚠️ AWAIT the async form data generation
    const formData = await createFormData(settings, logoUri);

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        delete requestConfig.headers['Content-Type'];
    }

    // Matches Backend: PUT /api/settings
    const { data } = await choirApi.put<AppSettings>('/settings', formData, requestConfig);
    return data;
};