import type { User } from './auth';

// Recursive-ish type for TipTap Content to allow flexibility (Bold, Italic, Empty lines)
export interface TipTapNode {
    type: string;
    text?: string;
    content?: TipTapNode[];
    marks?: { type: string }[];
    attrs?: Record<string, any>;
}

export interface BlogComment {
    author: string;
    text: { type: string, content?: TipTapNode[] };
    date: string;
}

export interface BlogPost {
    id: string;
    title: string;
    content: { type: string, content?: TipTapNode[] };
    author: {
        id: string;
        name: string;
        username: string;
        imageUrl: string;
    };
    imageUrl?: string;
    isPublic: boolean;
    likes: number;
    likesUsers: string[];
    comments: BlogComment[];
    createdAt: string;
}

export interface CreateBlogPayload {
    title: string;
    content: {
        type: string;
        content: TipTapNode[];
    };
    imageUri?: string;
    isPublic: boolean;
}