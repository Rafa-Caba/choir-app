import choirApi from '../api/choirApi';
import type { BlogPost, CreateBlogPayload } from '../types/blog';
import { Platform } from 'react-native';

// GET Public
export const getPublicPosts = async (): Promise<BlogPost[]> => {
    const { data } = await choirApi.get<BlogPost[]>('/blog/posts');
    return data;
};

// GET Single
export const getPostById = async (id: number): Promise<BlogPost> => {
    const { data } = await choirApi.get<BlogPost>(`/blog/posts/${id}`);
    return data;
};

// POST Like
export const toggleLike = async (id: number): Promise<BlogPost> => {
    const { data } = await choirApi.post<BlogPost>(`/blog/posts/${id}/like`);
    return data;
};

// POST Comment
export const addComment = async (id: number, textContent: string): Promise<BlogPost> => {
    // Construct Rich Text JSON
    const richText = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: textContent }] }]
    };
    
    const { data } = await choirApi.post<BlogPost>(`/blog/posts/${id}/comment`, richText);
    return data;
};

// POST Create (Admin) - Reuse the FormData logic from Announcements/Gallery
export const createPost = async (payload: CreateBlogPayload): Promise<BlogPost> => {
    const formData = new FormData();
    const richText = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: payload.textContent }] }]
    };
    
    const dto = {
        title: payload.title,
        isPublic: payload.isPublic,
        content: richText
    };
    
    // Use Blob for Web, String for Mobile (handled by Axios interceptor/manual if needed)
    formData.append('data', JSON.stringify(dto));

    if (payload.imageUri && !payload.imageUri.startsWith('http')) {
        const filename = payload.imageUri.split('/').pop() || 'img.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore
        formData.append('file', {
            uri: Platform.OS === 'android' ? payload.imageUri : payload.imageUri.replace('file://', ''),
            name: filename,
            type: type,
        });
    }

    const { data } = await choirApi.post<BlogPost>('/blog/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};