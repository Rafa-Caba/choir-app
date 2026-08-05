// src/screens/blog/BlogListScreen.tsx

import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BlogStackParamList } from '../../navigation/BlogNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { BlogCard } from '../../components/blog/BlogCard';
import {
    useBlogPostsQuery,
    useDeleteBlogMutation
} from '../../hooks/query/useBlogData';
import type { BlogPost } from '../../types/blog';

export const BlogListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<BlogStackParamList, 'BlogList'>>();
    const colors = useTheme().currentTheme;
    const postsQuery = useBlogPostsQuery();
    const deleteMutation = useDeleteBlogMutation();
    const user = useAuthStore((state) => state.user);
    const posts = postsQuery.data ?? [];
    const canManage = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const handleDelete = (id: string): void => {
        const confirmDelete = (): void => {
            deleteMutation.mutate(id, {
                onError: () => Alert.alert('Error', 'No fue posible eliminar la publicación.')
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Eliminar esta publicación?')) {
                confirmDelete();
            }
            return;
        }

        Alert.alert('Eliminar publicación', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
        ]);
    };

    const renderPost = ({ item }: { readonly item: BlogPost }) => (
        <BlogCard
            post={item}
            onPress={() => navigation.navigate('BlogDetail', { postId: item.id })}
            onEdit={canManage ? () => navigation.navigate('CreateBlog', { postToEdit: item }) : undefined}
            onDelete={canManage ? () => handleDelete(item.id) : undefined}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Blog</Text>
                {canManage && (
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.buttonColor }]}
                        onPress={() => navigation.navigate('CreateBlog')}
                    >
                        <Text style={[styles.createButtonText, { color: colors.buttonTextColor }]}>+ Nuevo</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={renderPost}
                refreshing={postsQuery.isRefetching}
                onRefresh={() => void postsQuery.refetch()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={postsQuery.isLoading ? (
                    <ActivityIndicator color={colors.primaryColor} style={styles.loader} />
                ) : postsQuery.isError ? (
                    <View style={styles.errorState}>
                        <Text style={[styles.empty, { color: colors.secondaryTextColor }]}>No fue posible cargar las publicaciones.</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void postsQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.empty, { color: colors.secondaryTextColor }]}>No hay publicaciones.</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    createButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    createButtonText: { fontWeight: 'bold' },
    listContent: { paddingBottom: 20, flexGrow: 1 },
    empty: { textAlign: 'center', marginTop: 50 },
    loader: { marginTop: 50 },
    errorState: { alignItems: 'center', marginTop: 30 },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }
});
