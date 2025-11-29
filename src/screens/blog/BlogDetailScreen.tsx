import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { Ionicons } from '@expo/vector-icons';
import { MediaViewerModal } from '../../components/shared/MediaViewerModal';

export const BlogDetailScreen = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { currentPost, likePost, commentOnPost } = useBlogStore();
    const { user } = useAuthStore();
    const [comment, setComment] = useState('');
    const [showImageModal, setShowImageModal] = useState(false);

    if (!currentPost) return (
        <View style={[styles.center, { backgroundColor: colors.backgroundColor }]}>
            <Text style={{ color: colors.textColor }}>No post selected</Text>
        </View>
    );

    const authorName = currentPost.author?.name || 'Unknown Author';
    const isLiked = user ? currentPost.likesUsers.includes(user.id) : false;

    const handleComment = () => {
        if (comment.trim()) {
            commentOnPost(currentPost.id, comment);
            setComment('');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.backgroundColor }}>
            <MediaViewerModal
                visible={showImageModal}
                onClose={() => setShowImageModal(false)}
                mediaUrl={currentPost.imageUrl || null}
                mediaType="image"
            />

            <ScrollView style={styles.container}>
                {currentPost.imageUrl && (
                    <TouchableOpacity onPress={() => setShowImageModal(true)}>
                        <Image source={{ uri: currentPost.imageUrl }} style={styles.image} />
                    </TouchableOpacity>
                )}

                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.textColor }]}>
                        {currentPost.title}
                    </Text>
                    <View style={styles.meta}>
                        <Text style={[styles.author, { color: colors.primaryColor }]}>
                            By: {authorName}
                        </Text>
                        <Text style={[styles.date, { color: colors.secondaryTextColor }]}>
                            {new Date(currentPost.createdAt).toLocaleDateString()}
                        </Text>
                    </View>

                    <Text style={[styles.body, { color: colors.textColor }]}>
                        {getPreviewFromRichText(currentPost.content, 10000)}
                    </Text>

                    {/* Like Button */}
                    <TouchableOpacity style={styles.likeBtn} onPress={() => likePost(currentPost.id)}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color="#E91E63" />
                        <Text style={[styles.likeText, { color: colors.secondaryTextColor }]}>
                            {currentPost.likes} Likes
                        </Text>
                    </TouchableOpacity>

                    {/* Comments */}
                    <Text style={[styles.commentHeader, { color: colors.textColor }]}>
                        Comments ({currentPost.comments.length})
                    </Text>

                    {currentPost.comments.map((c, i) => (
                        <View key={i} style={[styles.commentItem, { backgroundColor: colors.cardColor }]}>
                            <Text style={[styles.commentAuthor, { color: colors.secondaryTextColor }]}>
                                {c.author}
                            </Text>
                            <Text style={[styles.commentText, { color: colors.textColor }]}>
                                {getPreviewFromRichText(c.text)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Comment Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.backgroundColor, color: colors.textColor }]}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.secondaryTextColor}
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity onPress={handleComment}>
                    <Ionicons name="send" size={24} color={colors.buttonTextColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: '100%', height: 250 },
    content: { padding: 20, paddingBottom: 80 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    author: { fontWeight: '600' },
    date: {},
    body: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    likeText: { marginLeft: 5, fontSize: 16 },
    commentHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    commentItem: { padding: 10, borderRadius: 8, marginBottom: 10 },
    commentAuthor: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    commentText: { fontSize: 14 },
    inputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, alignItems: 'center' },
    input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 }
});