// src/services/mediaActions.ts

import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { MediaKind } from '../types/mediaStorage';

export class MediaActionError extends Error {
    readonly code:
        | 'SHARING_UNAVAILABLE'
        | 'PHOTO_PERMISSION_DENIED'
        | 'UNSUPPORTED_MEDIA_TYPE';

    constructor(code: MediaActionError['code'], message: string) {
        super(message);
        this.name = 'MediaActionError';
        this.code = code;
    }
}

export const shareLocalMedia = async (
    localUri: string,
    mimeType: string,
    dialogTitle = 'Compartir archivo'
): Promise<void> => {
    if (Platform.OS === 'web') {
        throw new MediaActionError(
            'SHARING_UNAVAILABLE',
            'El uso compartido de archivos locales no está disponible en web.'
        );
    }

    const available = await Sharing.isAvailableAsync();

    if (!available) {
        throw new MediaActionError(
            'SHARING_UNAVAILABLE',
            'La hoja de compartir no está disponible en este dispositivo.'
        );
    }

    await Sharing.shareAsync(localUri, {
        dialogTitle,
        mimeType
    });
};

export const saveLocalMediaToPhotos = async (
    localUri: string,
    kind: MediaKind
): Promise<void> => {
    if (kind !== 'IMAGE' && kind !== 'VIDEO') {
        throw new MediaActionError(
            'UNSUPPORTED_MEDIA_TYPE',
            'Solo se pueden guardar imágenes y videos en Fotos.'
        );
    }

    if (Platform.OS === 'web') {
        throw new MediaActionError(
            'UNSUPPORTED_MEDIA_TYPE',
            'Guardar contenido en Fotos no está disponible en web.'
        );
    }

    const permission = await MediaLibrary.requestPermissionsAsync(true);

    if (permission.status !== 'granted') {
        throw new MediaActionError(
            'PHOTO_PERMISSION_DENIED',
            'Choir App necesita permiso para guardar el archivo en Fotos.'
        );
    }

    await MediaLibrary.saveToLibraryAsync(localUri);
};

export const openLocalMediaWithNativeSheet = async (
    localUri: string,
    mimeType: string
): Promise<void> => {
    await shareLocalMedia(localUri, mimeType, 'Abrir con…');
};

export const saveLocalMediaToFiles = async (
    localUri: string,
    mimeType: string
): Promise<void> => {
    await shareLocalMedia(localUri, mimeType, 'Guardar en Archivos');
};
