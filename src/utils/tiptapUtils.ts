// src/utils/tiptapUtils.ts

import type {
    TipTapDocument,
    TipTapNode
} from '../types/tiptap';

const inlineNodesToText = (nodes: readonly TipTapNode[] | undefined): string => {
    return (nodes ?? []).map((node) => {
        if (node.type === 'text') {
            return node.text ?? '';
        }

        if (node.type === 'hardBreak') {
            return '\n';
        }

        return inlineNodesToText(node.content);
    }).join('');
};

export const tiptapToPlainText = (
    document: TipTapDocument | null | undefined
): string => {
    if (!document || document.type !== 'doc') {
        return '';
    }

    return document.content.map((block) => {
        if (block.type === 'paragraph' || block.type === 'heading') {
            return inlineNodesToText(block.content);
        }

        if (block.type === 'bulletList' || block.type === 'orderedList') {
            return (block.content ?? [])
                .map((item) => inlineNodesToText(item.content?.[0]?.content))
                .join('\n');
        }

        if (block.type === 'blockquote') {
            return inlineNodesToText(block.content?.[0]?.content);
        }

        return inlineNodesToText(block.content);
    }).join('\n');
};

export const plainTextToTiptap = (text: string): TipTapDocument => ({
    type: 'doc',
    content: text.split('\n').map((line): TipTapNode => ({
        type: 'paragraph',
        attrs: { textAlign: 'left' },
        content: line.length > 0
            ? [{ type: 'text', text: line }]
            : []
    }))
});
