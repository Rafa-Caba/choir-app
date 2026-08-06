// src/screens/blog/BlogDetailScreen.tsx

import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { MediaViewerModal } from '../../components/shared/MediaViewerModal';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import type { BlogStackParamList } from '../../navigation/BlogNavigator';
import {
    useBlogPostsQuery,
    useCommentOnBlogMutation,
    useToggleBlogLikeMutation
} from '../../hooks/query/useBlogData';
import { getPreviewFromRichText } from '../../utils/textUtils';

export const BlogDetailScreen = () => {
    const colors = useTheme().currentTheme;
    const route = useRoute<RouteProp<BlogStackParamList, 'BlogDetail'>>();
    const user = useAuthStore((state) => state.user);
    const postsQuery = useBlogPostsQuery();
    const likeMutation = useToggleBlogLikeMutation();
    const commentMutation = useCommentOnBlogMutation();
    const currentPost = postsQuery.data?.find((post) => post.id === route.params.postId) ?? null;
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);

    if (!currentPost) {
        return (
            <View style={[styles.center, { backgroundColor: colors.backgroundColor }]}>
                <Text style={{ color: colors.textColor }}>Publicación no encontrada.</Text>
            </View>
        );
    }

    const isLiked = user ? currentPost.likesUsers.includes(user.id) : false;
    const mediaUrl = currentPost.cachedImageUrl ?? currentPost.imageUrl ?? null;

    const handleComment = async (): Promise<void> => {
        const normalized = comment.trim();

        if (!normalized || submittingComment) {
            return;
        }

        setSubmittingComment(true);
        try {
            await commentMutation.mutateAsync({ id: currentPost.id, text: normalized });
            setComment('');
        } catch {
            Alert.alert('Error', 'No fue posible publicar el comentario.');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.backgroundColor }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
                {mediaUrl && (
                    <TouchableOpacity onPress={() => setViewerVisible(true)}>
                        <Image source={{ uri: mediaUrl }} style={styles.image} />
                    </TouchableOpacity>
                )}

                <Text style={[styles.title, { color: colors.textColor }]}>{currentPost.title}</Text>
                <View style={styles.meta}>
                    <Text style={[styles.author, { color: colors.primaryColor }]}>
                        Por: {currentPost.author.name}
                    </Text>
                    <Text style={[styles.date, { color: colors.secondaryTextColor }]}>
                        {new Date(currentPost.createdAt).toLocaleDateString('es-MX')}
                    </Text>
                </View>

                <Text style={[styles.body, { color: colors.textColor }]}>
                    {getPreviewFromRichText(currentPost.content, 20_000)}
                </Text>

                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => likeMutation.mutate(currentPost.id)}
                >
                    <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color="#E91E63" />
                    <Text style={[styles.likeText, { color: colors.secondaryTextColor }]}>
                        {currentPost.likes} {currentPost.likes === 1 ? 'Me gusta' : 'Me gusta'}
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.commentHeader, { color: colors.textColor }]}>
                    Comentarios ({currentPost.comments.length})
                </Text>

                {currentPost.comments.map((item, index) => (
                    <View
                        key={`${item.author}-${item.date}-${index}`}
                        style={[styles.commentItem, { backgroundColor: colors.cardColor }]}
                    >
                        <Text style={[styles.commentAuthor, { color: colors.secondaryTextColor }]}>
                            {item.author}
                        </Text>
                        <Text style={[styles.commentText, { color: colors.textColor }]}>
                            {getPreviewFromRichText(item.text)}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            <View
                style={[
                    styles.inputContainer,
                    { backgroundColor: colors.cardColor, borderColor: colors.borderColor }
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        { backgroundColor: colors.backgroundColor, color: colors.textColor }
                    ]}
                    placeholder="Escribe un comentario..."
                    placeholderTextColor={colors.secondaryTextColor}
                    value={comment}
                    onChangeText={setComment}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    returnKeyType="send"
                    onSubmitEditing={() => void handleComment()}
                    editable={!submittingComment}
                />
                <TouchableOpacity
                    onPress={() => void handleComment()}
                    disabled={!comment.trim() || submittingComment}
                >
                    <Ionicons name="send" size={24} color={colors.primaryColor} />
                </TouchableOpacity>
            </View>

            <MediaViewerModal
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                mediaUrl={mediaUrl}
                mediaType="image"
                category="blog"
                filename="blog.jpg"
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 24 },
    image: { width: '100%', height: 250 },
    title: { fontSize: 28, fontWeight: '700', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 18 },
    author: { fontWeight: '600' },
    date: { fontSize: 14 },
    body: { fontSize: 17, lineHeight: 25, marginHorizontal: 20, marginBottom: 24 },
    likeButton: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 24 },
    likeText: { marginLeft: 7, fontSize: 16 },
    commentHeader: { fontSize: 20, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
    commentItem: { padding: 12, borderRadius: 10, marginHorizontal: 20, marginBottom: 10 },
    commentAuthor: { fontWeight: '700', fontSize: 12, marginBottom: 4 },
    commentText: { fontSize: 15 },
    inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, alignItems: 'center' },
    input: { flex: 1, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 }
});
