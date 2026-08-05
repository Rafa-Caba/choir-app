// src/types/tiptap.ts

export type TipTapTextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface TipTapMarkAttributes {
    readonly color?: string;
}

export interface TipTapMark {
    readonly type: string;
    readonly attrs?: TipTapMarkAttributes;
}

export interface TipTapNodeAttributes {
    readonly level?: number;
    readonly textAlign?: TipTapTextAlignment;
}

export interface TipTapNode {
    readonly type: string;
    readonly text?: string;
    readonly attrs?: TipTapNodeAttributes;
    readonly marks?: readonly TipTapMark[];
    readonly content?: readonly TipTapNode[];
}

export interface TipTapDocument {
    readonly type: 'doc';
    readonly content: readonly TipTapNode[];
}
