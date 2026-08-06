// src/types/gallery.ts

export interface GalleryImage {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly imageUrl: string;
    readonly cachedImageUrl?: string | null;
    readonly cachedThumbnailUrl?: string | null;
    readonly cachedPreviewUrl?: string | null;
    readonly mediaType: 'IMAGE' | 'VIDEO';
    readonly imageStart: boolean;
    readonly imageTopBar: boolean;
    readonly imageUs: boolean;
    readonly imageLogo: boolean;
    readonly imageGallery: boolean;
    readonly imageLeftMenu?: boolean;
    readonly imageRightMenu?: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface GalleryMediaDetailParams {
    readonly media: GalleryImage;
    readonly previewUri?: string;
}

export interface CreateGalleryPayload {
    readonly title: string;
    readonly description: string;
    readonly imageUri: string;
    readonly imageGallery: boolean;
}

export type GalleryFlag =
    | 'imageStart'
    | 'imageTopBar'
    | 'imageUs'
    | 'imageLogo'
    | 'imageGallery'
    | 'imageLeftMenu'
    | 'imageRightMenu';

export type GalleryFlags = Partial<Record<GalleryFlag, boolean>>;
