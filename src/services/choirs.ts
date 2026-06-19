import { Platform } from 'react-native';
import { Choir, CreateChoirPayload, PaginatedChoirResponse } from '../types/choir';
import choirApi from '../api/choirApi';

const buildChoirFormData = async (payload: CreateChoirPayload, imageUri?: string) => {
    const formData = new FormData();

    formData.append('name', payload.name);
    formData.append('code', payload.code);

    if (payload.description) {
        formData.append('description', payload.description);
    }

    if (typeof payload.isActive === 'boolean') {
        formData.append('isActive', String(payload.isActive));
    }

    // Optional logo upload (field must be "file")
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'choir-logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            // @ts-ignore
            formData.append('file', blob, filename);
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type,
            });
        }
    }

    return formData;
};

const getMultipartConfig = () => {
    const config: any = {
        headers: { 'Content-Type': 'multipart/form-data' },
    };

    // RN-web: let axios set boundary automatically
    if (Platform.OS === 'web') {
        delete config.headers['Content-Type'];
    }

    return config;
};

// ADMIN LIST (Paginated)
export const getChoirs = async (page: number = 1): Promise<PaginatedChoirResponse> => {
    const { data } = await choirApi.get<PaginatedChoirResponse>(`/choirs?page=${page}`);
    return data;
};

// GET ONE
export const getChoirById = async (id: string): Promise<Choir> => {
    const { data } = await choirApi.get<Choir>(`/choirs/${id}`);
    return data;
};

// CREATE / UPDATE (Multipart)
export const saveChoir = async (
    payload: CreateChoirPayload,
    imageUri?: string,
    id?: string
): Promise<Choir> => {
    const formData = await buildChoirFormData(payload, imageUri);
    const config = getMultipartConfig();

    if (id) {
        const { data } = await choirApi.put<Choir>(`/choirs/${id}`, formData, config);
        return data;
    }

    const { data } = await choirApi.post<Choir>('/choirs', formData, config);
    return data;
};

// DELETE
export const deleteChoir = async (id: string): Promise<void> => {
    await choirApi.delete(`/choirs/${id}`);
};

// Toggle active / inactive
export const toggleChoirActive = async (
    id: string,
    isActive: boolean
): Promise<Choir> => {
    const formData = new FormData();
    formData.append('isActive', String(isActive));

    const config: any = {
        headers: { 'Content-Type': 'multipart/form-data' },
    };

    if (Platform.OS === 'web') {
        delete config.headers['Content-Type'];
    }

    const { data } = await choirApi.put<Choir>(`/choirs/${id}`, formData, config);
    return data;
};
