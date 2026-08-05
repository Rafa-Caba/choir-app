// src/components/song/TipTapViewer.tsx

import React from 'react';
import {
    StyleSheet,
    Text,
    type TextStyle,
    View
} from 'react-native';
import type {
    TipTapDocument,
    TipTapMark,
    TipTapNode
} from '../../types/tiptap';

interface Props {
    readonly content: TipTapDocument | null | undefined;
    readonly textColor?: string;
}

const getInlineStyle = (marks: readonly TipTapMark[] | undefined): TextStyle => {
    const style: TextStyle = {};

    for (const mark of marks ?? []) {
        if (mark.type === 'bold') {
            style.fontWeight = 'bold';
        }
        if (mark.type === 'italic') {
            style.fontStyle = 'italic';
        }
        if (mark.type === 'underline') {
            style.textDecorationLine = 'underline';
        }
        if (mark.type === 'textStyle' && mark.attrs?.color) {
            style.color = mark.attrs.color;
        }
    }

    return style;
};

const renderInline = (inlines: readonly TipTapNode[] = []): readonly React.ReactNode[] => {
    return inlines.map((node, index) => {
        if (node.type === 'text') {
            return (
                <Text key={`${node.type}-${index}`} style={getInlineStyle(node.marks)}>
                    {node.text ?? ''}
                </Text>
            );
        }

        if (node.type === 'hardBreak') {
            return <Text key={`${node.type}-${index}`}>{'\n'}</Text>;
        }

        return null;
    });
};

const renderHeading = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => {
    const level = block.attrs?.level ?? 1;
    const size = level === 1 ? 24 : level === 2 ? 20 : 18;

    return (
        <Text
            key={`heading-${index}`}
            style={{
                fontSize: size,
                fontWeight: 'bold',
                color: textColor,
                marginBottom: 6
            }}
        >
            {renderInline(block.content)}
        </Text>
    );
};

const renderParagraph = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => {
    const alignment = block.attrs?.textAlign ?? 'left';

    return (
        <Text
            key={`paragraph-${index}`}
            style={[styles.paragraph, { textAlign: alignment, color: textColor }]}
        >
            {renderInline(block.content)}
        </Text>
    );
};

const renderBulletList = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => (
    <View key={`bullet-list-${index}`} style={styles.listContainer}>
        {(block.content ?? []).map((item, itemIndex) => (
            <View key={`bullet-item-${itemIndex}`} style={styles.listRow}>
                <Text style={[styles.bullet, { color: textColor }]}>•</Text>
                <Text style={[styles.listText, { color: textColor }]}> 
                    {renderInline(item.content?.[0]?.content)}
                </Text>
            </View>
        ))}
    </View>
);

const renderOrderedList = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => (
    <View key={`ordered-list-${index}`} style={styles.listContainer}>
        {(block.content ?? []).map((item, itemIndex) => (
            <View key={`ordered-item-${itemIndex}`} style={styles.listRow}>
                <Text style={[styles.number, { color: textColor }]}>{itemIndex + 1}.</Text>
                <Text style={[styles.listText, { color: textColor }]}> 
                    {renderInline(item.content?.[0]?.content)}
                </Text>
            </View>
        ))}
    </View>
);

const renderBlockquote = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => (
    <View key={`blockquote-${index}`} style={styles.quoteContainer}>
        <View style={styles.quoteBar} />
        <Text style={[styles.quoteText, { color: textColor }]}> 
            {renderInline(block.content?.[0]?.content)}
        </Text>
    </View>
);

const renderBlock = (
    block: TipTapNode,
    index: number,
    textColor: string
): React.ReactNode => {
    switch (block.type) {
        case 'heading':
            return renderHeading(block, index, textColor);
        case 'paragraph':
            return renderParagraph(block, index, textColor);
        case 'bulletList':
            return renderBulletList(block, index, textColor);
        case 'orderedList':
            return renderOrderedList(block, index, textColor);
        case 'blockquote':
            return renderBlockquote(block, index, textColor);
        default:
            return null;
    }
};

export const TipTapViewer = ({ content, textColor = '#000000' }: Props) => {
    if (!content || content.type !== 'doc') {
        return null;
    }

    return (
        <View style={styles.container}>
            {content.content.map((block, index) => renderBlock(block, index, textColor))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', paddingVertical: 5 },
    paragraph: {
        marginBottom: 4,
        fontSize: 16,
        lineHeight: 20
    },
    listContainer: { marginBottom: 6 },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
    bullet: { marginRight: 6, fontSize: 16 },
    number: { marginRight: 6, fontSize: 16 },
    listText: { fontSize: 16, flexShrink: 1 },
    quoteContainer: {
        flexDirection: 'row',
        marginVertical: 6,
        paddingLeft: 10
    },
    quoteBar: {
        width: 4,
        backgroundColor: '#888888',
        marginRight: 10,
        borderRadius: 2
    },
    quoteText: { fontStyle: 'italic', flexShrink: 1 }
});
