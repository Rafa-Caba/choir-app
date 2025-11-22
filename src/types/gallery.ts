export interface GalleryImage {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    // We don't need all the "imageStart", "imageTopBar" flags on the frontend unless you filter by them
    // For now, we just show them all.
    createdAt: string;
}

export interface CreateGalleryPayload {
    title: string;
    description: string;
    imageUri: string;
    imageGallery: boolean; // Defaults to true
}