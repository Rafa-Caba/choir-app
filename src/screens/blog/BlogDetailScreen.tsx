import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { Ionicons } from '@expo/vector-icons';

export const BlogDetailScreen = () => {
    const { currentPost, likePost, commentOnPost } = useBlogStore();
    const { user } = useAuthStore();
    const [comment, setComment] = useState('');

    if (!currentPost) return <View><Text>No post selected</Text></View>;

    const authorName = currentPost.author?.name || 'Autor Desconocido';

    const isLiked = currentPost.likesUsers.includes(user?.username || '');

    const handleComment = () => {
        if (comment.trim()) {
            commentOnPost(currentPost.id, comment);
            setComment('');
        }
    };

    return (
        <View style={{flex:1}}>
            <ScrollView style={styles.container}>
                {currentPost.imageUrl && (
                    <Image source={{ uri: currentPost.imageUrl }} style={styles.image} />
                )}
                
                <View style={styles.content}>
                    <Text style={styles.title}>{currentPost.title}</Text>
                    <View style={styles.meta}>
                        <Text style={styles.author}>Por: {authorName}</Text>
                        <Text style={styles.date}>{new Date(currentPost.createdAt).toLocaleDateString()}</Text>
                    </View>

                    <Text style={styles.body}>
                        {getPreviewFromRichText(currentPost.content, 10000)}
                    </Text>

                    {/* Like Button */}
                    <TouchableOpacity style={styles.likeBtn} onPress={() => likePost(currentPost.id)}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color="#E91E63" />
                        <Text style={styles.likeText}>{currentPost.likes} Me gusta</Text>
                    </TouchableOpacity>

                    {/* Comments List */}
                    <Text style={styles.commentHeader}>Comentarios ({currentPost.comments.length})</Text>
                    {currentPost.comments.map((c, i) => (
                        <View key={i} style={styles.commentItem}>
                            <Text style={styles.commentAuthor}>{c.author}</Text>
                            <Text style={styles.commentText}>{getPreviewFromRichText(c.text)}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Escribe un comentario..."
                    value={comment}
                    onChangeText={setComment}
                />
                <TouchableOpacity onPress={handleComment}>
                    <Ionicons name="send" size={24} color="#8B4BFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 200 },
    content: { padding: 20, paddingBottom: 80 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    author: { color: '#8B4BFF', fontWeight: '600' },
    date: { color: '#999' },
    body: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    likeText: { marginLeft: 5, fontSize: 16, color: '#555' },
    commentHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    commentItem: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 10 },
    commentAuthor: { fontWeight: 'bold', fontSize: 12, color: '#666', marginBottom: 2 },
    commentText: { fontSize: 14 },
    inputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#eee', backgroundColor: 'white', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 }
});