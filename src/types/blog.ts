import type { User } from './auth';

export interface BlogComment {
    author: string; // Username
    text: { type: string, content?: any[] }; // Rich Text
    date: string; // ISO Date
}

export interface BlogPost {
    id: number;
    title: string;
    content: { type: string, content?: any[] };
    author: { // Matches BlogPostDTO.AuthorInfo
        id: number;
        name: string;
        username: string;
        imageUrl: string;
    };
    imageUrl?: string;
    isPublic: boolean;
    likes: number;
    likesUsers: string[]; // List of usernames
    comments: BlogComment[];
    createdAt: string;
}

export interface CreateBlogPayload {
    title: string;
    textContent: string;
    imageUri?: string;
    isPublic: boolean;
}