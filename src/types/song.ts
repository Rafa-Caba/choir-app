export interface SongType {
    id: number;
    name: string;
    order: number;
}

export interface Song {
    id: number;
    title: string;
    composer?: string;
    content: { // Rich Text JSON
        type: string;
        content?: any[];
    };
    songTypeId: number;
    songTypeName: string;
}

// For Creating/Updating
export interface SongPayload {
    title: string;
    composer?: string;
    content: any; // JSON object
    songTypeId: number;
}