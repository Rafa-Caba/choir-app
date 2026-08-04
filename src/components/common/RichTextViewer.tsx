// src/components/common/RichTextViewer.tsx

import React, { type ReactNode } from 'react';
import {
    StyleSheet,
    Text,
    View,
    type TextStyle,
    type ViewStyle
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { TipTapMark, TipTapNode } from '../../types/blog';
import type { JsonObject, JsonValue } from '../../types/json';
import type { SongContent } from '../../types/song';

type RichTextContent = JsonValue | TipTapNode | SongContent;

interface RichTextViewerProps {
    readonly content: RichTextContent;
    readonly tight?: boolean;
}

const isJsonObject = (value: JsonValue): value is JsonObject => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toTipTapMark = (value: JsonValue): TipTapMark | null => {
    if (!isJsonObject(value) || typeof value.type !== 'string') {
        return null;
    }

    return { type: value.type };
};

const toTipTapNode = (value: JsonValue): TipTapNode | null => {
    if (!isJsonObject(value) || typeof value.type !== 'string') {
        return null;
    }

    const content = Array.isArray(value.content)
        ? value.content
            .map(toTipTapNode)
            .filter((node): node is TipTapNode => node !== null)
        : undefined;
    const marks = Array.isArray(value.marks)
        ? value.marks
            .map(toTipTapMark)
            .filter((mark): mark is TipTapMark => mark !== null)
        : undefined;
    const attrsValue = value.attrs;
    const attrs = attrsValue !== undefined && isJsonObject(attrsValue)
        ? attrsValue
        : undefined;

    return {
        type: value.type,
        ...(typeof value.text === 'string' ? { text: value.text } : {}),
        ...(content ? { content } : {}),
        ...(marks ? { marks } : {}),
        ...(attrs ? { attrs } : {})
    };
};

const normalizeContent = (content: RichTextContent): TipTapNode | null => {
    if (typeof content === 'string') {
        try {
            return toTipTapNode(JSON.parse(content) as JsonValue);
        } catch {
            return {
                type: 'doc',
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: content }]
                }]
            };
        }
    }

    const serialized = JSON.parse(JSON.stringify(content)) as JsonValue;
    return toTipTapNode(serialized);
};

const mergeDecoration = (
    current: TextStyle['textDecorationLine'],
    addition: 'underline' | 'line-through'
): TextStyle['textDecorationLine'] => {
    const values = new Set((current ?? '').split(' ').filter(Boolean));
    values.add(addition);

    if (values.has('underline') && values.has('line-through')) {
        return 'underline line-through';
    }

    return values.has('underline') ? 'underline' : 'line-through';
};

const applyMarksToStyle = (marks?: readonly TipTapMark[]): TextStyle => {
    const style: TextStyle = {};

    marks?.forEach((mark) => {
        switch (mark.type) {
            case 'bold':
                style.fontWeight = '700';
                break;
            case 'italic':
                style.fontStyle = 'italic';
                break;
            case 'underline':
                style.textDecorationLine = mergeDecoration(style.textDecorationLine, 'underline');
                break;
            case 'strike':
            case 'strikeThrough':
                style.textDecorationLine = mergeDecoration(style.textDecorationLine, 'line-through');
                break;
            default:
                break;
        }
    });

    return style;
};

interface RenderPalette {
    readonly textColor: string;
    readonly secondaryTextColor: string;
    readonly borderColor: string;
}

const renderInlineNodes = (
    nodes: readonly TipTapNode[] | undefined,
    palette: RenderPalette
): ReactNode => {
    return nodes?.map((node, index) => {
        if (node.type === 'text') {
            return (
                <Text
                    key={`${node.type}-${index}`}
                    style={[{ color: palette.textColor }, applyMarksToStyle(node.marks)]}
                >
                    {node.text ?? ''}
                </Text>
            );
        }

        if (node.type === 'hardBreak') {
            return <Text key={`${node.type}-${index}`}>{'\n'}</Text>;
        }

        return null;
    }) ?? null;
};

const readNumericAttr = (node: TipTapNode, key: string, fallback: number): number => {
    const value = node.attrs?.[key];
    return typeof value === 'number' ? value : fallback;
};

const renderNode = (
    node: TipTapNode,
    index: number,
    tight: boolean,
    palette: RenderPalette
): ReactNode => {
    const paragraphStyle: ViewStyle = tight ? styles.paragraphTight : styles.paragraph;

    switch (node.type) {
        case 'paragraph':
            return (
                <View key={`${node.type}-${index}`} style={paragraphStyle}>
                    <Text style={[styles.paragraphText, { color: palette.textColor }]}>
                        {node.content?.length
                            ? renderInlineNodes(node.content, palette)
                            : ' '}
                    </Text>
                </View>
            );
        case 'heading': {
            const level = readNumericAttr(node, 'level', 1);
            const headingStyle = level === 1
                ? styles.heading1
                : level === 3
                    ? styles.heading3
                    : styles.heading2;

            return (
                <View
                    key={`${node.type}-${index}`}
                    style={tight ? styles.headingWrapperTight : styles.headingWrapper}
                >
                    <Text style={[headingStyle, { color: palette.textColor }]}>
                        {renderInlineNodes(node.content, palette)}
                    </Text>
                </View>
            );
        }
        case 'bulletList':
            return (
                <View key={`${node.type}-${index}`} style={styles.listWrapper}>
                    {node.content?.map((item, itemIndex) => (
                        <View key={`${item.type}-${itemIndex}`} style={styles.listItemRow}>
                            <Text style={[styles.bullet, { color: palette.textColor }]}>{'•'}</Text>
                            <View style={styles.flexOne}>
                                {item.content?.map((child, childIndex) => (
                                    renderNode(child, childIndex, tight, palette)
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            );
        case 'orderedList': {
            const start = readNumericAttr(node, 'start', 1);
            return (
                <View key={`${node.type}-${index}`} style={styles.listWrapper}>
                    {node.content?.map((item, itemIndex) => (
                        <View key={`${item.type}-${itemIndex}`} style={styles.listItemRow}>
                            <Text style={[styles.bullet, { color: palette.textColor }]}>
                                {`${start + itemIndex}.`}
                            </Text>
                            <View style={styles.flexOne}>
                                {item.content?.map((child, childIndex) => (
                                    renderNode(child, childIndex, tight, palette)
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            );
        }
        case 'blockquote':
            return (
                <View
                    key={`${node.type}-${index}`}
                    style={[
                        tight ? styles.blockquoteTight : styles.blockquote,
                        { borderLeftColor: palette.borderColor }
                    ]}
                >
                    {node.content?.map((child, childIndex) => (
                        renderNode(child, childIndex, tight, palette)
                    ))}
                </View>
            );
        default:
            return node.content?.length ? (
                <View key={`${node.type}-${index}`}>
                    {node.content.map((child, childIndex) => (
                        renderNode(child, childIndex, tight, palette)
                    ))}
                </View>
            ) : null;
    }
};

export const RichTextViewer = ({
    content,
    tight = true
}: RichTextViewerProps) => {
    const colors = useTheme().currentTheme;
    const document = normalizeContent(content);

    if (!document) {
        return null;
    }

    const palette: RenderPalette = {
        textColor: colors.textColor,
        secondaryTextColor: colors.secondaryTextColor,
        borderColor: colors.borderColor
    };
    const nodes = document.type === 'doc' ? document.content ?? [] : [document];

    return (
        <View style={styles.root}>
            {nodes.map((node, index) => renderNode(node, index, tight, palette))}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { width: '100%' },
    flexOne: { flex: 1 },
    paragraph: { marginBottom: 6 },
    paragraphTight: { marginBottom: 3 },
    paragraphText: { fontSize: 16, lineHeight: 22 },
    headingWrapper: { marginTop: 10, marginBottom: 6 },
    headingWrapperTight: { marginTop: 8, marginBottom: 4 },
    heading1: { fontSize: 22, fontWeight: '700' },
    heading2: { fontSize: 20, fontWeight: '700' },
    heading3: { fontSize: 18, fontWeight: '600' },
    listWrapper: { marginBottom: 6 },
    listItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
    bullet: { width: 22, fontSize: 16, lineHeight: 22 },
    blockquote: { borderLeftWidth: 3, paddingLeft: 8, marginVertical: 8 },
    blockquoteTight: { borderLeftWidth: 3, paddingLeft: 8, marginVertical: 4 }
});
