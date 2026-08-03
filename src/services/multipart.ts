// src/services/multipart.ts

import type { AxiosRequestConfig } from 'axios';

export interface LocalUpload {
    readonly uri: string;
    readonly filename: string;
    readonly mimeType: string;
}

export const appendLocalFile = async (
    formData: FormData,
    fieldName: string,
    upload: LocalUpload
): Promise<void> => {
    const response = await fetch(upload.uri);

    if (!response.ok) {
        throw new Error('No fue posible leer el archivo seleccionado');
    }

    const originalBlob = await response.blob();
    const blob = originalBlob.type === upload.mimeType
        ? originalBlob
        : originalBlob.slice(0, originalBlob.size, upload.mimeType);

    formData.append(fieldName, blob, upload.filename);
};

export const getMultipartRequestConfig = (): AxiosRequestConfig => ({});
