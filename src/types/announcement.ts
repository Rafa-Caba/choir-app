export interface TipTapContent {
    type: string;
    content?: any[];
}

export interface Announcement {
    id: string;
    title: string;
    content: TipTapContent; // Rich text JSON
    imageUrl?: string;
    imagePublicId?: string;
    isPublic: boolean;

    createdBy?: {
        id: string;
        name: string;
        username: string;
    };

    createdAt: string;
    updatedAt: string;
}

export interface CreateAnnouncementPayload {
    title: string;
    // We send TipTap structure
    content: {
        type: string;
        content: any[];
    };
    imageUri?: string;
    isPublic: boolean;
}