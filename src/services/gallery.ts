import choirApi from '../api/choirApi';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';
import { Platform } from 'react-native';

// GET /api/gallery
export const getAllImages = async (): Promise<GalleryImage[]> => {
    const { data } = await choirApi.get<GalleryImage[]>('/gallery');
    return data;
};

// POST /api/gallery (Multipart)
export const uploadImage = async (payload: CreateGalleryPayload): Promise<GalleryImage> => {
    const formData = new FormData();

    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('imageGallery', String(payload.imageGallery));

    // --- FIXED IMAGE HANDLING ---
    if (payload.imageUri) {
        const filename = payload.imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            // 🌍 WEB FIX: Fetch blob
            const response = await fetch(payload.imageUri);
            const blob = await response.blob();
            formData.append('image', blob, filename);
        } else {
            // 📱 MOBILE: Standard way
            // @ts-ignore
            formData.append('image', {
                uri: Platform.OS === 'android' ? payload.imageUri : payload.imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    // --- FIXED HEADERS ---
    const requestConfig: any = {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    };

    if (Platform.OS === 'web') {
        // 🌍 WEB FIX: Let browser generate boundary
        requestConfig.headers['Content-Type'] = undefined;
    }

    const { data } = await choirApi.post<GalleryImage>('/gallery', formData, requestConfig);
    return data;
};

export const deleteGalleryImage = async (id: number): Promise<void> => {
    await choirApi.delete(`/gallery/${id}`);
};