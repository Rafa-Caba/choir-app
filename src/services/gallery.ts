import choirApi from '../api/choirApi';
import type { GalleryImage, CreateGalleryPayload } from '../types/gallery';
import { Platform } from 'react-native';

export const getAllImages = async (): Promise<GalleryImage[]> => {
    const { data } = await choirApi.get<GalleryImage[]>('/gallery');
    return data;
};

export const uploadImage = async (payload: CreateGalleryPayload): Promise<GalleryImage> => {
    const formData = new FormData();

    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('imageGallery', String(payload.imageGallery));

    if (payload.imageUri) {
        const filename = payload.imageUri.split('/').pop() || 'upload';
        
        // --- Detect Mime Type ---
        let type = 'image/jpeg';
        const ext = filename.split('.').pop()?.toLowerCase();
        
        if (ext === 'mp4') type = 'video/mp4';
        else if (ext === 'mov') type = 'video/quicktime';
        else if (ext === 'png') type = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';

        if (Platform.OS === 'web') {
            const response = await fetch(payload.imageUri);
            const blob = await response.blob();
            formData.append('image', blob, filename);
        } else {
            // @ts-ignore
            formData.append('image', {
                uri: Platform.OS === 'android' ? payload.imageUri : payload.imageUri.replace('file://', ''),
                name: filename,
                type: type,
            });
        }
    }

    const requestConfig: any = {
        headers: { 'Content-Type': 'multipart/form-data' }
    };

    if (Platform.OS === 'web') {
        requestConfig.headers['Content-Type'] = undefined;
    }

    const { data } = await choirApi.post<GalleryImage>('/gallery', formData, requestConfig);
    return data;
};

// Update Flags
export const updateImageFlags = async (id: number, flags: any): Promise<GalleryImage> => {
    const { data } = await choirApi.put<GalleryImage>(`/gallery/${id}/flags`, flags);
    return data;
};

export const deleteGalleryImage = async (id: number): Promise<void> => {
    await choirApi.delete(`/gallery/${id}`);
};