// src/hooks/query/useBlogData.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    commentOnPost,
    createPost,
    deletePost,
    getAllPosts,
    togglePostLike,
    updatePost
} from '../../services/blog';
import type { BlogComment, BlogPost, CreateBlogPayload } from '../../types/blog';
import { queryKeys } from '../../query/queryKeys';
import { removeById, upsertById } from '../../query/cacheUpdates';
import { useAuthStore } from '../../store/useAuthStore';
import { useTenantQueryScope } from './useTenantQueryScope';

interface UpdateBlogVariables {
    readonly id: string;
    readonly payload: Partial<CreateBlogPayload>;
}

interface CommentVariables {
    readonly id: string;
    readonly text: string;
}

export const useBlogPostsQuery = () => {
    const scope = useTenantQueryScope();

    return useQuery({
        queryKey: queryKeys.blog(scope.tenantKey),
        queryFn: getAllPosts,
        enabled: scope.enabled
    });
};

export const useCreateBlogMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: createPost,
        onSuccess: (created) => {
            queryClient.setQueryData<readonly BlogPost[]>(
                queryKeys.blog(scope.tenantKey),
                (current) => upsertById(current, created)
            );
        }
    });
};

export const useUpdateBlogMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, payload }: UpdateBlogVariables) => updatePost(id, payload),
        onSuccess: (updated) => {
            queryClient.setQueryData<readonly BlogPost[]>(
                queryKeys.blog(scope.tenantKey),
                (current) => upsertById(current, updated)
            );
        }
    });
};

export const useDeleteBlogMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: deletePost,
        onSuccess: (_data, id) => {
            queryClient.setQueryData<readonly BlogPost[]>(
                queryKeys.blog(scope.tenantKey),
                (current) => removeById(current, id)
            );
        }
    });
};

export const useToggleBlogLikeMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();
    const userId = useAuthStore((state) => state.user?.id ?? null);

    return useMutation({
        mutationFn: togglePostLike,
        onSuccess: (response, id) => {
            queryClient.setQueryData<readonly BlogPost[]>(
                queryKeys.blog(scope.tenantKey),
                (current) => (current ?? []).map((post) => {
                    if (post.id !== id || !userId) {
                        return post;
                    }

                    const likesUsers = response.liked
                        ? [...post.likesUsers.filter((item) => item !== userId), userId]
                        : post.likesUsers.filter((item) => item !== userId);

                    return {
                        ...post,
                        likes: response.likes,
                        likesUsers
                    };
                })
            );
        }
    });
};

export const useCommentOnBlogMutation = () => {
    const queryClient = useQueryClient();
    const scope = useTenantQueryScope();

    return useMutation({
        mutationFn: ({ id, text }: CommentVariables) => commentOnPost(id, text),
        onSuccess: (comment: BlogComment, variables) => {
            queryClient.setQueryData<readonly BlogPost[]>(
                queryKeys.blog(scope.tenantKey),
                (current) => (current ?? []).map((post) => post.id === variables.id
                    ? { ...post, comments: [...post.comments, comment] }
                    : post)
            );
        }
    });
};
