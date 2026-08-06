// src/hooks/useMediaResource.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import type {
    MediaDownloadProgress,
    MediaDownloadState,
    MediaKind,
    MediaStorageLocation,
    StoredMediaRecord
} from '../types/mediaStorage';
import type { MediaCacheCategory, TenantStorageContext } from '../types/sync';
import {
    cleanupExpiredTemporaryMedia,
    downloadMediaFile,
    getStoredMediaRecord,
    shouldAutoDownloadMedia
} from '../storage/mediaStorage';
import { loadMediaStoragePreferences } from '../storage/mediaStoragePreferences';

interface UseMediaResourceOptions {
    readonly remoteUrl: string;
    readonly filename?: string;
    readonly mimeType?: string;
    readonly kind: MediaKind;
    readonly category: MediaCacheCategory;
    readonly autoDownload?: boolean;
}

export interface MediaResourceController {
    readonly context: TenantStorageContext | null;
    readonly record: StoredMediaRecord | null;
    readonly displayUri: string;
    readonly state: MediaDownloadState;
    readonly progress: MediaDownloadProgress | null;
    readonly errorMessage: string | null;
    readonly refresh: () => Promise<StoredMediaRecord | null>;
    readonly ensureLocalFile: (
        location?: MediaStorageLocation
    ) => Promise<StoredMediaRecord>;
}

const zeroProgress: MediaDownloadProgress = {
    bytesWritten: 0,
    totalBytes: 0,
    fraction: 0
};

export const useMediaResource = (
    options: UseMediaResourceOptions
): MediaResourceController => {
    const getTenantContext = useAuthStore((state) => state.getTenantContext);
    const context = getTenantContext();
    const [record, setRecord] = useState<StoredMediaRecord | null>(null);
    const [state, setState] = useState<MediaDownloadState>('IDLE');
    const [progress, setProgress] = useState<MediaDownloadProgress | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const contextKey = context
        ? `${context.choirId}:${context.userId}`
        : 'no-context';

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refresh = useCallback(async (): Promise<StoredMediaRecord | null> => {
        if (!context || !options.remoteUrl || Platform.OS === 'web') {
            if (mountedRef.current) {
                setRecord(null);
                setState('IDLE');
            }
            return null;
        }

        if (mountedRef.current) {
            setState('CHECKING');
        }

        const stored = await getStoredMediaRecord(context, options.remoteUrl);

        if (mountedRef.current) {
            setRecord(stored);
            setState(stored ? 'READY' : 'IDLE');
            setErrorMessage(null);
        }

        return stored;
    }, [contextKey, options.remoteUrl]);

    const runDownload = useCallback(async (
        location: MediaStorageLocation
    ): Promise<StoredMediaRecord> => {
        if (!context) {
            throw new Error('No hay un contexto de coro activo para guardar el archivo.');
        }

        if (!options.remoteUrl) {
            throw new Error('La URL del archivo no está disponible.');
        }

        if (mountedRef.current) {
            setState('DOWNLOADING');
            setProgress(zeroProgress);
            setErrorMessage(null);
        }

        try {
            const result = await downloadMediaFile({
                context,
                category: options.category,
                remoteUrl: options.remoteUrl,
                filename: options.filename,
                mimeType: options.mimeType,
                kind: options.kind,
                location,
                onProgress: (nextProgress) => {
                    if (mountedRef.current) {
                        setProgress(nextProgress);
                    }
                }
            });

            if (mountedRef.current) {
                setRecord(result.record);
                setProgress({
                    bytesWritten: result.record.bytes,
                    totalBytes: result.record.bytes,
                    fraction: 1
                });
                setState('READY');
            }

            return result.record;
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'No fue posible descargar el archivo.';

            if (mountedRef.current) {
                setState('ERROR');
                setErrorMessage(message);
                setProgress(null);
            }

            throw error;
        }
    }, [
        contextKey,
        options.category,
        options.filename,
        options.kind,
        options.mimeType,
        options.remoteUrl
    ]);

    const ensureLocalFile = useCallback(async (
        location?: MediaStorageLocation
    ): Promise<StoredMediaRecord> => {
        if (record && (!location || record.location === location)) {
            return record;
        }

        if (!context) {
            throw new Error('No hay un contexto de coro activo para guardar el archivo.');
        }

        const preferences = await loadMediaStoragePreferences(context);
        const resolvedLocation = location ?? (
            preferences.keepDownloadedFiles ? 'DOCUMENTS' : 'CACHE'
        );
        return runDownload(resolvedLocation);
    }, [contextKey, record, runDownload]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = async (): Promise<void> => {
            const stored = await refresh();

            if (
                cancelled ||
                stored ||
                !context ||
                !options.remoteUrl ||
                options.autoDownload === false
            ) {
                return;
            }

            await cleanupExpiredTemporaryMedia(context).catch(() => undefined);
            const allowed = await shouldAutoDownloadMedia(context).catch(() => false);

            if (!cancelled && allowed) {
                await runDownload('CACHE').catch(() => undefined);
            }
        };

        void hydrate();

        return () => {
            cancelled = true;
        };
    }, [
        contextKey,
        options.autoDownload,
        options.remoteUrl,
        refresh,
        runDownload
    ]);

    const displayUri = useMemo(
        () => record?.localUri || options.remoteUrl,
        [record?.localUri, options.remoteUrl]
    );

    return {
        context,
        record,
        displayUri,
        state,
        progress,
        errorMessage,
        refresh,
        ensureLocalFile
    };
};
