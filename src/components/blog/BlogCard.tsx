import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { BlogPost } from '../../types/blog';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    post: BlogPost;
    onPress: () => void;
}

export const BlogCard = ({ post, onPress }: Props) => {
    const dateStr = new Date(post.createdAt).toLocaleDateString();
    const preview = getPreviewFromRichText(post.content, 120);

    const authorName = post.author?.name || 'Autor Desconocido';
    const authorImage = post.author?.imageUrl || 'https://via.placeholder.com/30';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            {/* Header Image (if exists) */}
            {post.imageUrl && (
                <Image source={{ uri: post.imageUrl }} style={styles.coverImage} />
            )}

            <View style={styles.content}>
                <Text style={styles.title}>{post.title}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.authorBlock}>
                        <Image 
                            source={{ uri: authorImage }}
                            style={styles.avatar} 
                        />
                        <Text style={styles.authorName}>{authorName}</Text>
                    </View>
                    <Text style={styles.date}>{dateStr}</Text>
                </View>

                <Text style={styles.preview}>{preview}</Text>

                <View style={styles.footer}>
                    <View style={styles.stat}>
                        <Ionicons name="heart-outline" size={16} color="#E91E63" />
                        <Text style={styles.statText}>{post.likes}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="chatbubble-outline" size={16} color="#8B4BFF" />
                        <Text style={styles.statText}>{post.comments.length}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        marginHorizontal: 5
    },
    coverImage: {
        width: '100%',
        height: 180,
    },
    content: {
        padding: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    authorBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    authorName: {
        fontSize: 12,
        color: '#555',
        fontWeight: '600'
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    preview: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 15,
    },
    footer: {
        flexDirection: 'row',
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    statText: {
        fontSize: 12,
        color: '#555'
    }
});