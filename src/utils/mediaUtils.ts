// src/utils/mediaUtils.ts

import type { GalleryImage } from '../types/gallery';

const cloudinaryUploadSegment = '/upload/';
const galleryPreviewTransformation = 'c_fill,w_720,h_720,q_auto,f_auto';
const videoExtensionPattern = /\.(mp4|mov|avi|3gp|m4v|webm)(?=($|\?))/iu;

const convertVideoUrlToPoster = (url: string): string => {
    return url.replace(videoExtensionPattern, '.jpg');
};

const addCloudinaryTransformation = (
    url: string,
    transformation: string
): string => {
    if (!url.includes(cloudinaryUploadSegment)) {
        return url;
    }

    return url.replace(
        cloudinaryUploadSegment,
        `${cloudinaryUploadSegment}${transformation}/`
    );
};

export const isRemoteMediaUri = (uri: string): boolean => {
    return /^https?:\/\//iu.test(uri);
};

export const getCloudinaryThumbnail = (url: string): string | null => {
    if (!url) {
        return null;
    }

    const posterUrl = videoExtensionPattern.test(url)
        ? convertVideoUrlToPoster(url)
        : url;

    return addCloudinaryTransformation(
        posterUrl,
        galleryPreviewTransformation
    );
};

export const getGalleryDisplayUri = (media: GalleryImage): string => {
    return media.cachedImageUrl ?? media.imageUrl;
};

export const getGalleryPreviewUri = (media: GalleryImage): string => {
    if (media.mediaType === 'IMAGE' && media.cachedImageUrl) {
        return media.cachedImageUrl;
    }

    return getCloudinaryThumbnail(media.imageUrl) ?? media.imageUrl;
};
