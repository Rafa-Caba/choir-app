// src/utils/mediaUtils.ts

import type { GalleryImage } from '../types/gallery';

const cloudinaryUploadSegment = '/upload/';
const galleryGridTransformation = 'c_limit,w_720,h_720,q_auto,f_auto';
const galleryViewerTransformation = 'c_limit,w_1600,h_1600,q_auto,f_auto';
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

const getRemotePosterUri = (media: GalleryImage): string => {
    return media.mediaType === 'VIDEO'
        ? convertVideoUrlToPoster(media.imageUrl)
        : media.imageUrl;
};

export const isRemoteMediaUri = (uri: string): boolean => {
    return /^https?:\/\//iu.test(uri);
};

export const isLocalMediaUri = (uri: string | null | undefined): boolean => {
    return Boolean(uri && !isRemoteMediaUri(uri));
};

export const getGalleryGridRemoteUri = (media: GalleryImage): string => {
    return addCloudinaryTransformation(
        getRemotePosterUri(media),
        galleryGridTransformation
    );
};

export const getGalleryViewerRemoteUri = (media: GalleryImage): string => {
    return addCloudinaryTransformation(
        getRemotePosterUri(media),
        galleryViewerTransformation
    );
};

export const getGalleryDisplayUri = (media: GalleryImage): string => {
    return media.cachedImageUrl ?? media.imageUrl;
};

export const getGalleryGridUri = (media: GalleryImage): string => {
    return media.cachedThumbnailUrl ??
        media.cachedImageUrl ??
        getGalleryGridRemoteUri(media);
};

export const getGalleryViewerPreviewUri = (media: GalleryImage): string => {
    return media.cachedPreviewUrl ??
        media.cachedImageUrl ??
        getGalleryViewerRemoteUri(media);
};
