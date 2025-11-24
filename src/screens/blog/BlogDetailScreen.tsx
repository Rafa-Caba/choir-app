import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { Ionicons } from '@expo/vector-icons';

export const BlogDetailScreen = () => {
    // Theme Hook
    const { currentTheme } = useTheme();

    const { currentPost, likePost, commentOnPost } = useBlogStore();
    const { user } = useAuthStore();
    const [comment, setComment] = useState('');

    if (!currentPost) return <View><Text style={{ color: currentTheme.colors.text }}>No post selected</Text></View>;

    const authorName = currentPost.author?.name || 'Autor Desconocido';

    const isLiked = currentPost.likesUsers.includes(user?.username || '');

    const handleComment = () => {
        if (comment.trim()) {
            commentOnPost(currentPost.id, comment);
            setComment('');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: currentTheme.colors.background }}>
            <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
                {currentPost.imageUrl && (
                    <Image source={{ uri: currentPost.imageUrl }} style={styles.image} />
                )}
                
                <View style={styles.content}>
                    <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                        {currentPost.title}
                    </Text>
                    <View style={styles.meta}>
                        <Text style={[styles.author, { color: currentTheme.colors.primary }]}>
                            Por: {authorName}
                        </Text>
                        <Text style={[styles.date, { color: currentTheme.colors.textSecondary }]}>
                            {new Date(currentPost.createdAt).toLocaleDateString()}
                        </Text>
                    </View>

                    <Text style={[styles.body, { color: currentTheme.colors.text }]}>
                        {getPreviewFromRichText(currentPost.content, 10000)}
                    </Text>

                    {/* Like Button */}
                    <TouchableOpacity style={styles.likeBtn} onPress={() => likePost(currentPost.id)}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color="#E91E63" />
                        <Text style={[styles.likeText, { color: currentTheme.colors.textSecondary }]}>
                            {currentPost.likes} Me gusta
                        </Text>
                    </TouchableOpacity>

                    {/* Comments List */}
                    <Text style={[styles.commentHeader, { color: currentTheme.colors.text }]}>
                        Comentarios ({currentPost.comments.length})
                    </Text>
                    
                    {currentPost.comments.map((c, i) => (
                        <View key={i} style={[styles.commentItem, { backgroundColor: currentTheme.colors.card }]}>
                            <Text style={[styles.commentAuthor, { color: currentTheme.colors.textSecondary }]}>
                                {c.author}
                            </Text>
                            <Text style={[styles.commentText, { color: currentTheme.colors.text }]}>
                                {getPreviewFromRichText(c.text)}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Comment Input */}
            <View style={[
                styles.inputContainer, 
                { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.border }
            ]}>
                <TextInput 
                    style={[
                        styles.input, 
                        { backgroundColor: currentTheme.colors.background, color: currentTheme.colors.text }
                    ]} 
                    placeholder="Escribe un comentario..."
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity onPress={handleComment}>
                    <Ionicons name="send" size={24} color={currentTheme.colors.buttonText} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    image: { width: '100%', height: 200 },
    content: { padding: 20, paddingBottom: 80 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    author: { fontWeight: '600' },
    date: { },
    body: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    likeText: { marginLeft: 5, fontSize: 16 },
    commentHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    commentItem: { padding: 10, borderRadius: 8, marginBottom: 10 },
    commentAuthor: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    commentText: { fontSize: 14 },
    inputContainer: { 
        flexDirection: 'row', 
        padding: 15, 
        borderTopWidth: 1, 
        alignItems: 'center' 
    },
    input: { 
        flex: 1, 
        borderRadius: 20, 
        paddingHorizontal: 15, 
        paddingVertical: 8, 
        marginRight: 10 
    }
});