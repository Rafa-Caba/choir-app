// src/storage/galleryMediaCache.ts

import { Platform } from 'react-native';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import type { GalleryImage } from '../types/gallery';
import type { TenantStorageContext } from '../types/sync';
import {
    getGalleryGridRemoteUri,
    getGalleryViewerRemoteUri
} from '../utils/mediaUtils';
import { readCache, writeCache } from './cacheStorage';
import {
    downloadMediaFile,
    getStoredMediaRecordsForUrls,
    shouldAutoDownloadMedia
} from './mediaStorage';

interface GalleryCacheTask {
    readonly remoteUrl: string;
    readonly filename: string;
}

export const hydrateGalleryLocalMedia = async (
    context: TenantStorageContext,
    images: readonly GalleryImage[]
): Promise<readonly GalleryImage[]> => {
    if (images.length === 0 || Platform.OS === 'web') {
        return images;
    }

    const remoteUrls = images.flatMap((image) => [
        image.imageUrl,
        getGalleryGridRemoteUri(image),
        getGalleryViewerRemoteUri(image)
    ]);
    const stored = await getStoredMediaRecordsForUrls(context, remoteUrls);

    return images.map((image) => ({
        ...image,
        cachedImageUrl: stored.get(image.imageUrl)?.localUri ?? null,
        cachedThumbnailUrl: stored.get(getGalleryGridRemoteUri(image))?.localUri ?? null,
        cachedPreviewUrl: stored.get(getGalleryViewerRemoteUri(image))?.localUri ?? null
    }));
};

export const loadGallerySnapshot = async (
    context: TenantStorageContext
): Promise<readonly GalleryImage[]> => {
    const cached = await readCache<readonly GalleryImage[]>(context, 'gallery');

    if (!cached) {
        return [];
    }

    return hydrateGalleryLocalMedia(context, cached.data);
};

export const saveGallerySnapshot = async (
    context: TenantStorageContext,
    images: readonly GalleryImage[]
): Promise<void> => {
    await writeCache(
        context,
        'gallery',
        images,
        null,
        CACHE_TTL_MS.gallery
    );
};

const buildPreviewTasks = (
    images: readonly GalleryImage[]
): readonly GalleryCacheTask[] => {
    const tasks = new Map<string, GalleryCacheTask>();

    for (const image of images) {
        const gridUrl = getGalleryGridRemoteUri(image);
        const viewerUrl = getGalleryViewerRemoteUri(image);

        tasks.set(gridUrl, {
            remoteUrl: gridUrl,
            filename: `${image.id}-grid-preview.jpg`
        });
        tasks.set(viewerUrl, {
            remoteUrl: viewerUrl,
            filename: `${image.id}-viewer-preview.jpg`
        });
    }

    return [...tasks.values()];
};

const runPreviewWorkers = async (
    context: TenantStorageContext,
    tasks: readonly GalleryCacheTask[]
): Promise<void> => {
    const queue = [...tasks];
    const workerCount = Math.min(3, queue.length);

    const worker = async (): Promise<void> => {
        while (queue.length > 0) {
            const task = queue.shift();

            if (!task) {
                return;
            }

            await downloadMediaFile({
                context,
                category: 'gallery',
                remoteUrl: task.remoteUrl,
                filename: task.filename,
                mimeType: 'image/jpeg',
                kind: 'IMAGE',
                location: 'CACHE',
                retries: 1
            }).catch(() => undefined);
        }
    };

    await Promise.all(
        Array.from({ length: workerCount }, () => worker())
    );
};

export const warmGalleryPreviewCache = async (
    context: TenantStorageContext,
    images: readonly GalleryImage[]
): Promise<readonly GalleryImage[]> => {
    if (
        images.length === 0 ||
        Platform.OS === 'web' ||
        !(await shouldAutoDownloadMedia(context).catch(() => false))
    ) {
        return hydrateGalleryLocalMedia(context, images);
    }

    await runPreviewWorkers(context, buildPreviewTasks(images));
    const hydrated = await hydrateGalleryLocalMedia(context, images);
    await saveGallerySnapshot(context, hydrated);
    return hydrated;
};
