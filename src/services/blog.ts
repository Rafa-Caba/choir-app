import choirApi from '../api/choirApi';
import type { BlogPost, CreateBlogPayload } from '../types/blog';
import { Platform } from 'react-native';

// Helper: Async FormData
const createFormData = async (payload: Partial<CreateBlogPayload>, imageUri?: string) => {
    const formData = new FormData();

    // Separate image from data
    const { imageUri: _, ...dataPayload } = payload;

    const finalPayload = {
        title: dataPayload.title,
        content: dataPayload.content,
        isPublic: dataPayload.isPublic,
        // Optional author if admin wants to override, otherwise handled by backend token
    };

    formData.append('data', JSON.stringify(finalPayload));

    if (imageUri && !imageUri.startsWith('http')) {
        const filename = 'cover.jpg';
        const type = 'image/jpeg';

        if (Platform.OS === 'web') {
            try {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } catch (e) {
                console.error("Web Blob Error:", e);
            }
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

// GET Public
export const getPublicPosts = async (): Promise<BlogPost[]> => {
    const { data } = await choirApi.get<BlogPost[]>('/blog/public');
    return data;
};

// GET Admin
export const getAllPosts = async (): Promise<BlogPost[]> => {
    const { data } = await choirApi.get<BlogPost[]>('/blog');
    return data;
};

// CREATE
export const createPost = async (payload: CreateBlogPayload): Promise<BlogPost> => {
    const formData = await createFormData(payload, payload.imageUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    const { data } = await choirApi.post<BlogPost>('/blog', formData, requestConfig);
    return data;
};

// UPDATE
export const updatePost = async (id: string, payload: Partial<CreateBlogPayload>): Promise<BlogPost> => {
    const formData = await createFormData(payload, payload.imageUri);

    const requestConfig: any = { headers: { 'Content-Type': 'multipart/form-data' } };
    if (Platform.OS === 'web') delete requestConfig.headers['Content-Type'];

    const { data } = await choirApi.put<BlogPost>(`/blog/${id}`, formData, requestConfig);
    return data;
};

// DELETE
export const deletePost = async (id: string): Promise<void> => {
    await choirApi.delete(`/blog/${id}`);
};

// LIKE
export const likePost = async (id: string, userId: string): Promise<BlogPost> => {
    const { data } = await choirApi.post<BlogPost>(`/blog/${id}/like`, { userId });
    return data;
};

// COMMENT
export const commentOnPost = async (id: string, text: string, author: string): Promise<BlogPost> => {
    // Backend expects 'text' and 'author'
    const { data } = await choirApi.post<BlogPost>(`/blog/${id}/comments`, {
        author,
        text
    });
    return data;
};