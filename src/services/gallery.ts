// src/services/gallery.ts

import choirApi from '../api/choirApi';
import type {
    CreateGalleryPayload,
    GalleryFlag,
    GalleryFlags,
    GalleryImage
} from '../types/gallery';
import { appendLocalFile, getMultipartRequestConfig } from './multipart';

const VIDEO_EXTENSIONS = ['mp4', 'mov', '3gp', 'm4v', 'webm'] as const;

const getUploadMetadata = (uri: string): { readonly filename: string; readonly mimeType: string } => {
    const cleanUri = uri.split('?')[0];
    const filename = cleanUri.split('/').pop() ?? 'gallery-upload.jpg';
    const extension = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const isVideo = VIDEO_EXTENSIONS.some((item) => item === extension);

    return {
        filename,
        mimeType: isVideo ? 'video/mp4' : extension === 'png' ? 'image/png' : 'image/jpeg'
    };
};

const createGalleryFormData = async (payload: CreateGalleryPayload): Promise<FormData> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
        title: payload.title,
        description: payload.description,
        imageGallery: payload.imageGallery,
        imageStart: false,
        imageTopBar: false,
        imageUs: false,
        imageLogo: false,
        imageLeftMenu: false,
        imageRightMenu: false
    }));

    const metadata = getUploadMetadata(payload.imageUri);
    await appendLocalFile(formData, 'file', {
        uri: payload.imageUri,
        ...metadata
    });
    return formData;
};

export const getAllImages = async (): Promise<readonly GalleryImage[]> => {
    const response = await choirApi.get<readonly GalleryImage[]>('/gallery');
    return response.data;
};

export const addImage = async (payload: CreateGalleryPayload): Promise<GalleryImage> => {
    const formData = await createGalleryFormData(payload);
    const response = await choirApi.post<GalleryImage>('/gallery', formData, getMultipartRequestConfig());
    return response.data;
};

export const removeImage = async (id: string): Promise<void> => {
    await choirApi.delete(`/gallery/${id}`);
};

export const setGalleryFlags = async (
    id: string,
    flags: GalleryFlags
): Promise<GalleryImage> => {
    let latest: GalleryImage | null = null;

    for (const [field, value] of Object.entries(flags)) {
        if (typeof value === 'boolean') {
            const response = await choirApi.patch<GalleryImage>(
                `/gallery/mark/${field as GalleryFlag}/${id}`,
                { value }
            );
            latest = response.data;
        }
    }

    if (!latest) {
        throw new Error('At least one gallery flag is required');
    }

    return latest;
};
