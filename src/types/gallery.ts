export interface GalleryImage {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    mediaType: 'IMAGE' | 'VIDEO'; // New
    createdAt: string;
}

export interface CreateGalleryPayload {
    title: string;
    description: string;
    imageUri: string;
    imageGallery: boolean;
}