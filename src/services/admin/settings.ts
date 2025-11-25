import choirApi from '../../api/choirApi';
import { Platform } from 'react-native';

// Helper (Same as Announcements/Users)
const createFormData = async (payload: any, imageUri?: string) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'logo.jpg';
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

export const getSettings = async () => {
    const { data } = await choirApi.get('/settings');
    return data;
};

export const updateSettings = async (settings: any, logoUri?: string) => {
    const formData = await createFormData(settings, logoUri);
    
    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };
    if (Platform.OS === 'web') requestConfig.headers['Content-Type'] = undefined;

    const { data } = await choirApi.put('/settings', formData, requestConfig);
    return data;
};