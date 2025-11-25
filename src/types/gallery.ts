export interface GalleryImage {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    mediaType: 'IMAGE' | 'VIDEO';
    
    // Flags
    imageStart: boolean;
    imageTopBar: boolean;
    imageUs: boolean;
    imageLogo: boolean;
    imageGallery: boolean;
    
    createdAt: string;
}

export interface CreateGalleryPayload {
    title: string;
    description: string;
    imageUri: string;
    imageGallery: boolean;
}