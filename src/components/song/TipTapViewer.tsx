import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface Props {
    content: any;
    textColor?: string;
}

export const TipTapViewer: React.FC<Props> = ({ content, textColor = '#000' }) => {
    if (!content || content.type !== 'doc') return null;

    return (
        <View style={styles.container}>
            {content.content?.map((block: any, index: number) => {
                switch (block.type) {

                    // --------------------------
                    // HEADINGS
                    // --------------------------
                    case "heading":
                        return renderHeading(block, index, textColor);

                    // --------------------------
                    // PARAGRAPHS
                    // --------------------------
                    case "paragraph":
                        return renderParagraph(block, index, textColor);

                    // --------------------------
                    // BULLET LIST
                    // --------------------------
                    case "bulletList":
                        return renderBulletList(block, index, textColor);

                    // --------------------------
                    // ORDERED LIST
                    // --------------------------
                    case "orderedList":
                        return renderOrderedList(block, index, textColor);

                    // --------------------------
                    // BLOCKQUOTE
                    // --------------------------
                    case "blockquote":
                        return renderBlockquote(block, index, textColor);

                    default:
                        return null;
                }
            })}
        </View>
    );
};

// =========================
// RENDER HELPERS
// =========================

// --- Headings ---
const renderHeading = (block: any, index: number, textColor: string) => {
    const level = block.attrs?.level ?? 1;
    const size = level === 1 ? 24 : level === 2 ? 20 : 18;

    return (
        <Text
            key={index}
            style={{
                fontSize: size,
                fontWeight: "bold",
                color: textColor,
                marginBottom: 6,
            }}
        >
            {renderInline(block.content)}
        </Text>
    );
};

// --- Paragraphs ---
const renderParagraph = (block: any, index: number, textColor: string) => {
    const alignment = block.attrs?.textAlign ?? "left";
    return (
        <Text
            key={index}
            style={[
                styles.paragraph,
                { textAlign: alignment, color: textColor }
            ]}
        >
            {renderInline(block.content)}
        </Text>
    );
};

// --- Bullet List ---
const renderBulletList = (block: any, index: number, textColor: string) => (
    <View key={index} style={styles.listContainer}>
        {block.content?.map((item: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
                <Text style={[styles.bullet, { color: textColor }]}>•</Text>
                <Text style={[styles.listText, { color: textColor }]}>
                    {renderInline(item.content?.[0]?.content)}
                </Text>
            </View>
        ))}
    </View>
);

// --- Ordered List ---
const renderOrderedList = (block: any, index: number, textColor: string) => (
    <View key={index} style={styles.listContainer}>
        {block.content?.map((item: any, idx: number) => (
            <View key={idx} style={styles.listRow}>
                <Text style={[styles.number, { color: textColor }]}>{idx + 1}.</Text>
                <Text style={[styles.listText, { color: textColor }]}>
                    {renderInline(item.content?.[0]?.content)}
                </Text>
            </View>
        ))}
    </View>
);

// --- Blockquote ---
const renderBlockquote = (block: any, index: number, textColor: string) => (
    <View key={index} style={styles.quoteContainer}>
        <View style={styles.quoteBar} />
        <Text style={[styles.quoteText, { color: textColor }]}>
            {renderInline(block.content?.[0]?.content)}
        </Text>
    </View>
);

const renderInline = (inlines: any[] = []) => {
    return inlines.map((node, index) => {
        if (node.type === 'text') {
            let style: any = {};

            node.marks?.forEach((mark: any) => {
                if (mark.type === 'bold') style.fontWeight = 'bold';
                if (mark.type === 'italic') style.fontStyle = 'italic';
                if (mark.type === 'underline') style.textDecorationLine = 'underline';
                if (mark.type === 'textStyle' && mark.attrs?.color) {
                    style.color = mark.attrs.color;
                }
            });

            return (
                <Text key={index} style={style}>
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

const styles = StyleSheet.create({
    container: { width: "100%", paddingVertical: 5 },

    paragraph: {
        marginBottom: 4,
        fontSize: 16,
        lineHeight: 20,
    },

    listContainer: { marginBottom: 6 },
    listRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
    bullet: { marginRight: 6, fontSize: 16 },
    number: { marginRight: 6, fontSize: 16 },
    listText: { fontSize: 16, flexShrink: 1 },

    quoteContainer: {
        flexDirection: "row",
        marginVertical: 6,
        paddingLeft: 10,
    },
    quoteBar: { width: 4, backgroundColor: "#888", marginRight: 10, borderRadius: 2 },
    quoteText: { fontStyle: "italic", flexShrink: 1 },
});
