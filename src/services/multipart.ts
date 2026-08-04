// src/services/multipart.ts

import type { AxiosRequestConfig } from 'axios';
import * as FileSystem from 'expo-file-system';

export interface LocalUpload {
    readonly uri: string;
    readonly filename: string;
    readonly mimeType: string;
}

interface NativeFormDataFile {
    readonly uri: string;
    readonly name: string;
    readonly type: string;
}

interface NativeFormData extends FormData {
    append(
        name: string,
        value: string | Blob | NativeFormDataFile,
        fileName?: string
    ): void;
}

const MIME_TYPES_BY_EXTENSION: Readonly<Record<string, string>> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

const EXTENSIONS_BY_MIME_TYPE: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

const removeQueryAndFragment = (value: string): string => {
    return value.split(/[?#]/, 1)[0] ?? value;
};

const decodeFilename = (value: string): string => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const filenameFromUri = (uri: string): string | null => {
    const cleanUri = removeQueryAndFragment(uri);
    const candidate = cleanUri.split('/').pop()?.trim();

    if (!candidate || !candidate.includes('.')) {
        return null;
    }

    return decodeFilename(candidate);
};

const extensionOf = (filename: string): string => {
    const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] ?? '';
};

const sanitizeFilename = (filename: string): string => {
    const sanitized = filename
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');

    return sanitized || 'upload.bin';
};

const normalizeMimeType = (
    filename: string,
    fallbackMimeType: string
): string => {
    const inferred = MIME_TYPES_BY_EXTENSION[extensionOf(filename)];
    return inferred ?? (fallbackMimeType.trim().toLowerCase() || 'application/octet-stream');
};

const ensureMatchingExtension = (
    filename: string,
    mimeType: string
): string => {
    const expectedExtension = EXTENSIONS_BY_MIME_TYPE[mimeType];

    if (!expectedExtension) {
        return filename;
    }

    const currentExtension = extensionOf(filename);

    if (currentExtension && MIME_TYPES_BY_EXTENSION[currentExtension] === mimeType) {
        return filename;
    }

    const baseName = filename.replace(/\.[^/.]+$/, '');
    return `${baseName || 'upload'}.${expectedExtension}`;
};

export const createLocalUpload = (
    uri: string,
    fallbackFilename: string,
    fallbackMimeType: string
): LocalUpload => {
    const sourceFilename = filenameFromUri(uri) ?? fallbackFilename;
    const mimeType = normalizeMimeType(sourceFilename, fallbackMimeType);
    const filename = ensureMatchingExtension(
        sanitizeFilename(sourceFilename),
        mimeType
    );

    return {
        uri,
        filename,
        mimeType
    };
};

const assertReadableLocalFile = async (uri: string): Promise<void> => {
    if (!uri.startsWith('file://')) {
        return;
    }

    const info = await FileSystem.getInfoAsync(uri, { size: true });

    if (!info.exists || info.isDirectory) {
        throw new Error('El archivo seleccionado ya no está disponible');
    }

    if (typeof info.size === 'number' && info.size <= 0) {
        throw new Error('El archivo seleccionado está vacío');
    }
};

export const appendLocalFile = async (
    formData: FormData,
    fieldName: string,
    upload: LocalUpload
): Promise<void> => {
    const normalizedUri = upload.uri.trim();

    if (!normalizedUri) {
        throw new Error('La ruta del archivo seleccionado está vacía');
    }

    await assertReadableLocalFile(normalizedUri);

    const nativeFormData = formData as NativeFormData;
    nativeFormData.append(fieldName, {
        uri: normalizedUri,
        name: upload.filename,
        type: upload.mimeType
    });
};

export const getMultipartRequestConfig = (): AxiosRequestConfig => ({
    transformRequest: (data) => data
});
