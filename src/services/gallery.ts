import choirApi from '../api/choirApi';
import { Platform } from 'react-native';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';

// Helper: Async FormData
const createFormData = async (payload: CreateGalleryPayload) => {
    const formData = new FormData();

    const dataPayload = {
        title: payload.title,
        description: payload.description,
        imageGallery: payload.imageGallery,
        // Default other flags to false for new uploads
        imageStart: false,
        imageTopBar: false,
        imageUs: false,
        imageLogo: false
    };

    formData.append('data', JSON.stringify(dataPayload));

    if (payload.imageUri) {
        const uri = payload.imageUri;
        let filename = 'upload.jpg';
        let type = 'image/jpeg';

        // Detect Video from URI extension
        if (!uri.startsWith('data:')) {
            const cleanUri = uri.split('?')[0];
            filename = cleanUri.split('/').pop() || 'upload.jpg';
            const ext = filename.split('.').pop()?.toLowerCase();

            if (['mp4', 'mov', '3gp', 'm4v', 'webm'].includes(ext || '')) {
                type = 'video/mp4';
                if (!filename.endsWith(ext!)) filename += `.${ext}`;
            }
        }
        // Detect from Data URI
        else {
            const mimeMatch = uri.match(/^data:(.*?);/);
            if (mimeMatch && mimeMatch[1].includes('video')) {
                type = 'video/mp4';
                filename = 'upload.mp4';
            }
        }

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(uri);
                const blob = await response.blob();
                // Force type slice for videos
                const finalBlob = type.includes('video') ? blob.slice(0, blob.size, type) : blob;
                formData.append('file', finalBlob, filename);
            } catch (e) { console.error("Web Blob Error:", e); }
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    return formData;
};

// GET All
export const getAllImages = async (): Promise<GalleryImage[]> => {
    const { data } = await choirApi.get<GalleryImage[]>('/gallery');
    return data;
};

// CREATE
export const addImage = async (payload: CreateGalleryPayload): Promise<boolean> => {
    try {
        const formData = await createFormData(payload);

        const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

        await choirApi.post('/gallery', formData, requestConfig);
        return true;
    } catch (error) {
        console.error("Gallery Upload Error:", error);
        return false;
    }
};

// DELETE
export const removeImage = async (id: string): Promise<void> => {
    await choirApi.delete(`/gallery/${id}`);
};

// PATCH Flags
export const setFlags = async (id: string, flags: Record<string, boolean>): Promise<void> => {
    if ('imageGallery' in flags) {
        await choirApi.patch(`/gallery/mark/imageGallery/${id}`, {
            value: flags.imageGallery
        });
    } else {
        for (const [key, value] of Object.entries(flags)) {
            if (value === true) {
                await choirApi.patch(`/gallery/mark/${key}/${id}`);
            }
        }
    }
};