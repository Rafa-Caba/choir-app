// src/types/song.ts

import type { TipTapNode } from './blog';

export interface SongType {
    readonly id: string;
    readonly name: string;
    readonly order: number;
    readonly parentId?: string | null;
    readonly isParent: boolean;
    readonly updatedAt?: string;
}

export type SongContent = TipTapNode;

export interface Song {
    readonly id: string;
    readonly title: string;
    readonly composer?: string;
    readonly content: SongContent;
    readonly songTypeId: string | null;
    readonly songTypeName: string;
    readonly audioUrl?: string;
    readonly cachedAudioUrl?: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface CreateSongPayload {
    readonly title: string;
    readonly composer?: string;
    readonly content: SongContent;
    readonly songTypeId: string;
}