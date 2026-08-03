// src/types/announcement.ts

import type { JsonValue } from './json';

export interface TipTapContent {
    readonly type: string;
    readonly content?: readonly JsonValue[];
}

export interface AnnouncementAuthor {
    readonly id: string;
    readonly name: string;
    readonly username: string;
}

export interface Announcement {
    readonly id: string;
    readonly title: string;
    readonly content: TipTapContent;
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
    readonly content: TipTapContent;
    readonly imageUri?: string;
    readonly isPublic: boolean;
}
