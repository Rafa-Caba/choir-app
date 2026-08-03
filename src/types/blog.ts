// src/types/blog.ts

import type { JsonObject, JsonValue } from './json';

export interface TipTapMark {
    readonly type: string;
}

export interface TipTapNode {
    readonly type: string;
    readonly text?: string;
    readonly content?: readonly TipTapNode[];
    readonly marks?: readonly TipTapMark[];
    readonly attrs?: JsonObject;
}

export interface BlogComment {
    readonly author: string;
    readonly text: JsonValue;
    readonly date: string;
}

export interface BlogAuthor {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly imageUrl?: string;
}

export interface BlogPost {
    readonly id: string;
    readonly title: string;
    readonly content: TipTapNode;
    readonly author: BlogAuthor;
    readonly imageUrl?: string;
    readonly cachedImageUrl?: string | null;
    readonly isPublic: boolean;
    readonly likes: number;
    readonly likesUsers: readonly string[];
    readonly comments: readonly BlogComment[];
    readonly createdAt: string;
    readonly updatedAt?: string;
}

export interface CreateBlogPayload {
    readonly title: string;
    readonly content: TipTapNode;
    readonly imageUri?: string;
    readonly isPublic: boolean;
}
