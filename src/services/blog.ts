// src/services/blog.ts

import choirApi from '../api/choirApi';
import type { BlogComment, BlogPost, CreateBlogPayload } from '../types/blog';
import { appendLocalFile, getMultipartRequestConfig } from './multipart';

interface LikeResponse {
    readonly likes: number;
    readonly liked: boolean;
}

const createBlogFormData = async (
    payload: Partial<CreateBlogPayload>
): Promise<FormData> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
        title: payload.title,
        content: payload.content,
        isPublic: payload.isPublic
    }));

    if (payload.imageUri && !payload.imageUri.startsWith('http')) {
        await appendLocalFile(formData, 'file', {
            uri: payload.imageUri,
            filename: 'blog-cover.jpg',
            mimeType: 'image/jpeg'
        });
    }

    return formData;
};

export const getAllPosts = async (): Promise<readonly BlogPost[]> => {
    const response = await choirApi.get<readonly BlogPost[]>('/blog');
    return response.data;
};

export const createPost = async (payload: CreateBlogPayload): Promise<BlogPost> => {
    const formData = await createBlogFormData(payload);
    const response = await choirApi.post<BlogPost>('/blog', formData, getMultipartRequestConfig());
    return response.data;
};

export const updatePost = async (
    id: string,
    payload: Partial<CreateBlogPayload>
): Promise<BlogPost> => {
    const formData = await createBlogFormData(payload);
    const response = await choirApi.put<BlogPost>(`/blog/${id}`, formData, getMultipartRequestConfig());
    return response.data;
};

export const deletePost = async (id: string): Promise<void> => {
    await choirApi.delete(`/blog/${id}`);
};

export const togglePostLike = async (id: string): Promise<LikeResponse> => {
    const response = await choirApi.put<LikeResponse>(`/blog/${id}/like`);
    return response.data;
};

export const commentOnPost = async (
    id: string,
    text: string
): Promise<BlogComment> => {
    const response = await choirApi.post<BlogComment>(`/blog/${id}/comment`, { text });
    return response.data;
};
