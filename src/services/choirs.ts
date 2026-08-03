// src/services/choirs.ts

import choirApi from '../api/choirApi';
import type {
    Choir,
    CreateChoirPayload,
    PaginatedChoirResponse
} from '../types/choir';
import { appendLocalFile, getMultipartRequestConfig } from './multipart';

const getImageMimeType = (filename: string): string => {
    return filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
};

const buildChoirFormData = async (
    payload: CreateChoirPayload,
    imageUri?: string
): Promise<FormData> => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('code', payload.code);

    if (payload.description !== undefined) {
        formData.append('description', payload.description);
    }

    if (payload.isActive !== undefined) {
        formData.append('isActive', String(payload.isActive));
    }

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() ?? 'choir-logo.jpg';
        await appendLocalFile(formData, 'file', {
            uri: imageUri,
            filename,
            mimeType: getImageMimeType(filename)
        });
    }

    return formData;
};

export const getChoirs = async (page = 1): Promise<PaginatedChoirResponse> => {
    const response = await choirApi.get<PaginatedChoirResponse>('/choirs', {
        params: { page }
    });
    return response.data;
};

export const getChoirById = async (id: string): Promise<Choir> => {
    const response = await choirApi.get<Choir>(`/choirs/${id}`);
    return response.data;
};

export const saveChoir = async (
    payload: CreateChoirPayload,
    imageUri?: string,
    id?: string
): Promise<Choir> => {
    const formData = await buildChoirFormData(payload, imageUri);

    if (id) {
        const response = await choirApi.put<Choir>(
            `/choirs/${id}`,
            formData,
            getMultipartRequestConfig()
        );
        return response.data;
    }

    const response = await choirApi.post<Choir>(
        '/choirs',
        formData,
        getMultipartRequestConfig()
    );
    return response.data;
};

export const deleteChoir = async (id: string): Promise<void> => {
    await choirApi.delete(`/choirs/${id}`);
};

export const toggleChoirActive = async (
    id: string,
    isActive: boolean
): Promise<Choir> => {
    const formData = new FormData();
    formData.append('isActive', String(isActive));
    const response = await choirApi.put<Choir>(
        `/choirs/${id}`,
        formData,
        getMultipartRequestConfig()
    );
    return response.data;
};
