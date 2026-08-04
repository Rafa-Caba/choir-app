// src/types/announcement.ts

import type { TipTapNode } from './blog';

export interface AnnouncementAuthor {
    readonly id: string;
    readonly name: string;
    readonly username: string;
}

export interface Announcement {
    readonly id: string;
    readonly title: string;
    readonly content: TipTapNode;
    readonly imageUrl?: string;
    readonly imagePublicId?: string;
    readonly cachedImageUrl?: string | null;
    readonly isPublic: boolean;
    readonly createdBy?: AnnouncementAuthor;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface CreateAnnouncementPayload {
    readonly title: string;
    readonly content: TipTapNode;
    readonly imageUri?: string;
    readonly isPublic: boolean;
}
