import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BlogCard } from '../../components/blog/BlogCard';
import { styles as themeStyles } from '../../theme/appTheme';

export const BlogListScreen = () => {
    const navigation = useNavigation<any>();
    const { posts, fetchPosts, selectPost, loading } = useBlogStore();
    const { user } = useAuthStore();

    const canCreate = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePress = (post: any) => {
        selectPost(post);
        navigation.navigate('BlogDetail');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={themeStyles.title}>Blog</Text>
                {canCreate && (
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => navigation.navigate('CreateBlog')}
                    >
                        <Text style={styles.createBtnText}>+ Nuevo Post</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <BlogCard post={item} onPress={() => handlePress(item)} />
                )}
                refreshing={loading}
                onRefresh={fetchPosts}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.empty}>No hay publicaciones aún.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    createBtn: {
        backgroundColor: '#8B4BFF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#888'
    }
});