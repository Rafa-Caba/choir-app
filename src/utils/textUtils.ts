// src/utils/textUtils.ts

import type { TipTapNode } from '../types/blog';
import type { JsonObject, JsonValue } from '../types/json';

const isJsonObject = (value: JsonValue): value is JsonObject => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const readString = (object: JsonObject, key: string): string | null => {
    const value = object[key];
    return typeof value === 'string' ? value : null;
};

const readContent = (object: JsonObject): readonly JsonValue[] => {
    const value = object.content;
    return Array.isArray(value) ? value : [];
};

const extractNodeText = (value: JsonValue): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (!isJsonObject(value)) {
        return '';
    }

    const type = readString(value, 'type');

    if (type === 'text') {
        return readString(value, 'text') ?? '';
    }

    if (type === 'hardBreak') {
        return '\n';
    }

    const childText = readContent(value).map(extractNodeText).join('');

    if (type === 'paragraph' || type === 'heading' || type === 'listItem') {
        return `${childText}\n`;
    }

    return childText;
};

const toJsonValue = (content: JsonValue | TipTapNode): JsonValue => {
    return content as JsonValue;
};

export const getPreviewFromRichText = (
    content: JsonValue | TipTapNode,
    limit = 5_000
): string => {
    let normalized = toJsonValue(content);

    if (typeof normalized === 'string') {
        const rawText = normalized;
        try {
            normalized = JSON.parse(rawText) as JsonValue;
        } catch {
            return rawText.substring(0, limit);
        }
    }

    return extractNodeText(normalized)
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .substring(0, limit);
};

export const plainTextToRichText = (text: string): TipTapNode => ({
    type: 'doc',
    content: text.split('\n').map((line) => ({
        type: 'paragraph',
        content: line.length > 0
            ? [{ type: 'text', text: line }]
            : []
    }))
});
