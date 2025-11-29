export interface SongType {
    id: string;
    name: string;
    order: number;
    parentId?: string;
    isParent: boolean;
}

export interface Song {
    id: string;
    title: string;
    composer?: string;
    // TipTap JSON
    content: {
        type: string;
        content?: any[];
    };

    // Hierarchy Reference
    songTypeId: string | null;
    songTypeName: string;

    audioUrl?: string;

    createdAt: string;
    updatedAt: string;
}

// Payload for Forms
export interface CreateSongPayload {
    title: string;
    composer?: string;
    content: any;
    songTypeId: string;
}