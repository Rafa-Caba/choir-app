export interface SongType {
    id: number;
    name: string;
    order: number;
}

export interface Song {
    id: number;
    title: string;
    composer?: string;
    content: { 
        type: string;
        content?: any[];
    };
    songTypeId: number;
    songTypeName: string;
    audioUrl?: string;
}

// For use in Forms
export interface SongPayload {
    title: string;
    composer?: string;
    content: any;
    songTypeId: number;
}