import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { BlogCard } from '../../components/blog/BlogCard';

export const BlogListScreen = () => {
    const navigation = useNavigation<any>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { posts, fetchPosts, selectPost, deletePost, loading } = useBlogStore();
    const { user } = useAuthStore();

    const canManage = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePress = (post: any) => {
        selectPost(post);
        navigation.navigate('BlogDetail');
    };

    const handleEdit = (post: any) => {
        navigation.navigate('CreateBlog', { postToEdit: post });
    };

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Delete this post?")) deletePost(id);
        } else {
            Alert.alert("Delete Post", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deletePost(id) }
            ]);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Blog</Text>
                {canManage && (
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: colors.buttonColor }]}
                        onPress={() => navigation.navigate('CreateBlog')}
                    >
                        <Text style={[styles.createBtnText, { color: colors.buttonTextColor }]}>+ New Post</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <BlogCard
                        post={item}
                        onPress={() => handlePress(item)}
                        onEdit={canManage ? () => handleEdit(item) : undefined}
                        onDelete={canManage ? () => handleDelete(item.id) : undefined}
                    />
                )}
                refreshing={loading}
                onRefresh={fetchPosts}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={[styles.empty, { color: colors.secondaryTextColor }]}>
                        No posts available.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    createBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    createBtnText: { fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50 }
});