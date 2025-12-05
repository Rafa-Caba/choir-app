import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    type TextStyle,
    type ViewStyle,
} from 'react-native';

interface RichTextViewerProps {
    content: any;
    tight?: boolean;
}

/**
 * Safely merge underline / line-through into a valid RN `textDecorationLine` value
 */
const mergeDecoration = (
    current: TextStyle['textDecorationLine'],
    add: 'underline' | 'line-through'
): TextStyle['textDecorationLine'] => {
    const raw = (current as string | undefined) ?? '';

    const parts = new Set(
        raw
            .split(' ')
            .map(p => p.trim())
            .filter(Boolean)
    );

    parts.add(add);

    const hasUnderline = parts.has('underline');
    const hasStrike = parts.has('line-through');

    if (hasUnderline && hasStrike) return 'underline line-through';
    if (hasUnderline) return 'underline';
    if (hasStrike) return 'line-through';
    return 'none';
};

/**
 * Apply TipTap marks (bold, italic, underline, etc.) to a TextStyle
 */
const applyMarksToStyle = (marks?: any[]): TextStyle => {
    const style: TextStyle = {};
    if (!marks) return style;

    for (const mark of marks) {
        switch (mark.type) {
            case 'bold':
                style.fontWeight = 'bold';
                break;
            case 'italic':
                style.fontStyle = 'italic';
                break;
            case 'underline':
                style.textDecorationLine = mergeDecoration(
                    style.textDecorationLine,
                    'underline'
                );
                break;
            case 'strike':
            case 'strikeThrough':
                style.textDecorationLine = mergeDecoration(
                    style.textDecorationLine,
                    'line-through'
                );
                break;
            default:
                break;
        }
    }

    return style;
};

/**
 * Render inline nodes inside a <Text>
 */
const renderInlineNodes = (nodes?: any[]) => {
    if (!nodes || !Array.isArray(nodes)) return null;

    return nodes.map((node, index) => {
        if (node.type === 'text') {
            const inlineStyle = applyMarksToStyle(node.marks);
            return (
                <Text key={index} style={inlineStyle}>
                    {node.text}
                </Text>
            );
        }

        if (node.type === 'hardBreak') {
            return <Text key={index}>{'\n'}</Text>;
        }

        return null;
    });
};

/**
 * Recursive block renderer
 */
const renderNode = (node: any, index: number, tight: boolean) => {
    if (!node) return null;

    const baseParagraphStyle: ViewStyle = tight
        ? styles.paragraphTight
        : styles.paragraph;

    switch (node.type) {
        case 'paragraph': {
            const hasContent =
                node.content && Array.isArray(node.content) && node.content.length > 0;

            if (!hasContent) {
                return (
                    <View key={index} style={baseParagraphStyle}>
                        <Text style={styles.paragraphText}>{' '}</Text>
                    </View>
                );
            }

            return (
                <View key={index} style={baseParagraphStyle}>
                    <Text style={styles.paragraphText}>
                        {renderInlineNodes(node.content)}
                    </Text>
                </View>
            );
        }

        case 'heading': {
            const level = node.attrs?.level ?? 1;
            let textStyle: TextStyle = styles.heading2;
            if (level === 1) textStyle = styles.heading1;
            if (level === 3) textStyle = styles.heading3;

            return (
                <View
                    key={index}
                    style={tight ? styles.headingWrapperTight : styles.headingWrapper}
                >
                    <Text style={textStyle}>{renderInlineNodes(node.content)}</Text>
                </View>
            );
        }

        case 'bulletList':
            return (
                <View key={index} style={styles.listWrapper}>
                    {Array.isArray(node.content) &&
                        node.content.map((li: any, liIndex: number) => (
                            <View key={liIndex} style={styles.listItemRow}>
                                <Text style={styles.bullet}>{'\u2022'}</Text>
                                <View style={{ flex: 1 }}>
                                    {Array.isArray(li.content) &&
                                        li.content.map((liChild: any, childIndex: number) =>
                                            renderNode(liChild, childIndex, tight)
                                        )}
                                </View>
                            </View>
                        ))}
                </View>
            );

        case 'orderedList': {
            const start = node.attrs?.start ?? 1;
            return (
                <View key={index} style={styles.listWrapper}>
                    {Array.isArray(node.content) &&
                        node.content.map((li: any, liIndex: number) => (
                            <View key={liIndex} style={styles.listItemRow}>
                                <Text style={styles.bullet}>{`${start + liIndex}.`}</Text>
                                <View style={{ flex: 1 }}>
                                    {Array.isArray(li.content) &&
                                        li.content.map((liChild: any, childIndex: number) =>
                                            renderNode(liChild, childIndex, tight)
                                        )}
                                </View>
                            </View>
                        ))}
                </View>
            );
        }

        case 'blockquote':
            return (
                <View
                    key={index}
                    style={tight ? styles.blockquoteTight : styles.blockquote}
                >
                    {Array.isArray(node.content) &&
                        node.content.map((child: any, childIndex: number) =>
                            renderNode(child, childIndex, tight)
                        )}
                </View>
            );

        default:
            if (Array.isArray(node.content)) {
                return (
                    <View key={index}>
                        {node.content.map((child: any, childIndex: number) =>
                            renderNode(child, childIndex, tight)
                        )}
                    </View>
                );
            }
            return null;
    }
};

export const RichTextViewer: React.FC<RichTextViewerProps> = ({
    content,
    tight = true,
}) => {
    if (!content) return null;

    let json = content;

    if (typeof content === 'string') {
        try {
            json = JSON.parse(content);
        } catch {
            return <Text>{content}</Text>;
        }
    }

    const nodes: any[] =
        json && json.type === 'doc' && Array.isArray(json.content)
            ? json.content
            : [];

    return (
        <View style={styles.root}>
            {nodes.map((node, index) => renderNode(node, index, tight))}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        width: '100%',
    },

    // Paragraphs
    paragraph: {
        marginBottom: 6,
    },
    paragraphTight: {
        marginBottom: 3,
    },
    paragraphText: {
        fontSize: 16,
        lineHeight: 20,
    },

    // Headings
    headingWrapper: {
        marginTop: 10,
        marginBottom: 6,
    },
    headingWrapperTight: {
        marginTop: 8,
        marginBottom: 4,
    },
    heading1: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    heading3: {
        fontSize: 18,
        fontWeight: '600',
    },

    // Lists
    listWrapper: {
        marginBottom: 6,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    bullet: {
        width: 18,
        fontSize: 16,
        lineHeight: 20,
    },

    // Blockquote
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: '#ccc',
        paddingLeft: 8,
        marginVertical: 8,
    },
    blockquoteTight: {
        borderLeftWidth: 3,
        borderLeftColor: '#ccc',
        paddingLeft: 8,
        marginVertical: 4,
    },
});
