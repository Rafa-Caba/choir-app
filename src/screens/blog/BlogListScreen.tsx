import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlogStore } from '../../store/useBlogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { BlogCard } from '../../components/blog/BlogCard';
import { styles as themeStyles } from '../../theme/appTheme';

export const BlogListScreen = () => {
    const navigation = useNavigation<any>();
    
    // Theme Hook
    const { currentTheme } = useTheme();
    
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
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                {/* Overriding the global theme style color dynamically */}
                <Text style={[themeStyles.title, { color: currentTheme.colors.text }]}>
                    Blog
                </Text>
                {canCreate && (
                    <TouchableOpacity 
                        style={[styles.createBtn, { backgroundColor: currentTheme.colors.button }]}
                        onPress={() => navigation.navigate('CreateBlog')}
                    >
                        <Text style={[styles.createBtnText, { color: currentTheme.colors.buttonText }]}>
                            + Nuevo Post
                        </Text>
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
                ListEmptyComponent={
                    <Text style={[styles.empty, { color: currentTheme.colors.textSecondary }]}>
                        No hay publicaciones aún.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    createBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createBtnText: {
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
    }
});