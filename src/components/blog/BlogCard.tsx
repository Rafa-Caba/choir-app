import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { BlogPost } from '../../types/blog';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MediaViewerModal } from '../shared/MediaViewerModal';
import { RichTextViewer } from '../common/RichTextViewer';

interface Props {
    post: BlogPost;
    onPress: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const BlogCard = ({ post, onPress, onEdit, onDelete }: Props) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const [showModal, setShowModal] = useState(false);

    const dateStr = new Date(post.createdAt).toLocaleDateString();
    const preview = getPreviewFromRichText(post.content, 120);

    const authorName = post.author?.name || 'Unknown Author';
    const authorImage = post.author?.imageUrl || `https://ui-avatars.com/api/?name=${authorName}`;

    const commentCount = post.comments?.length || 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.cardColor, borderColor: colors.borderColor, borderWidth: 1 }]}>

            {/* Image Modal */}
            <MediaViewerModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                mediaUrl={post.imageUrl || null}
                mediaType="image"
            />

            {/* Header Image */}
            {post.imageUrl && (
                <TouchableOpacity onPress={() => setShowModal(true)}>
                    <Image source={{ uri: post.imageUrl }} style={styles.coverImage} />
                </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.content}>
                <Text style={[styles.title, { color: colors.textColor }]}>
                    {post.title}
                </Text>

                <View style={styles.metaRow}>
                    <View style={styles.authorBlock}>
                        <Image source={{ uri: authorImage }} style={styles.avatar} />
                        <Text style={[styles.authorName, { color: colors.secondaryTextColor }]}>
                            {authorName}
                        </Text>
                    </View>
                    <Text style={[styles.date, { color: colors.secondaryTextColor }]}>
                        {dateStr}
                    </Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <RichTextViewer content={post.content} tight />
                </View>
            </TouchableOpacity>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.borderColor }]}>
                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                        <Ionicons name="heart-outline" size={16} color="#E91E63" />
                        <Text style={[styles.statText, { color: colors.secondaryTextColor }]}>
                            {post.likes}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="chatbubble-outline" size={16} color={colors.primaryColor} />
                        <Text style={[styles.statText, { color: colors.textColor }]}>
                            {commentCount}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons
                            name="earth"
                            size={20}
                            color={post.isPublic ? colors.primaryColor : colors.secondaryTextColor}
                        />
                    </View>
                </View>

                {/* Actions */}
                {(onEdit || onDelete) && (
                    <View style={styles.actionsContainer}>
                        {onEdit && (
                            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                                <Ionicons name="pencil" size={18} color={colors.primaryColor} />
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { marginLeft: 15 }]}>
                                <Ionicons name="trash" size={18} color="#E91E63" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 15, marginBottom: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        overflow: 'hidden', marginHorizontal: 5
    },
    coverImage: { width: '100%', height: 180 },
    content: { padding: 15 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    authorBlock: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
    authorName: { fontSize: 12, fontWeight: '600' },
    date: { fontSize: 12 },
    preview: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, padding: 10, backgroundColor: 'rgba(0,0,0,0.02)' },
    statsContainer: { flexDirection: 'row', gap: 15 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statText: { fontSize: 12 },
    actionsContainer: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 5 }
});