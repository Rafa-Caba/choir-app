export interface Announcement {
    id: number;
    title: string;
    // This is your Rich Text JSON
    content: {
        type: string;
        content: any[];
    };
    imageUrl?: string;
    isPublic: boolean;
    createdAt: string;
}