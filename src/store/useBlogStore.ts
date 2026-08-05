// src/store/useBlogStore.ts

import { create } from 'zustand';
import {
    commentOnPost,
    createPost,
    deletePost,
    getAllPosts,
    togglePostLike,
    updatePost
} from '../services/blog';
import { getApiErrorMessage } from '../services/auth';
import type { BlogPost, CreateBlogPayload } from '../types/blog';
import { useAuthStore } from './useAuthStore';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';
import { removeById, upsertById } from '../query/cacheUpdates';

interface BlogState {
    readonly posts: readonly BlogPost[];
    readonly currentPost: BlogPost | null;
    readonly loading: boolean;
    readonly errorMessage: string | null;
    fetchPosts: () => Promise<void>;
    selectPost: (post: BlogPost) => void;
    likePost: (id: string) => Promise<void>;
    commentOnPost: (id: string, text: string) => Promise<void>;
    addPost: (payload: CreateBlogPayload) => Promise<boolean>;
    updatePost: (id: string, payload: Partial<CreateBlogPayload>) => Promise<boolean>;
    deletePost: (id: string) => Promise<void>;
    reset: () => void;
}

const readCachedPosts = (): readonly BlogPost[] => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return [];
    }

    return queryClient.getQueryData<readonly BlogPost[]>(
        queryKeys.blog(scope.tenantKey)
    ) ?? [];
};

const writeCachedPosts = (
    updater: (current: readonly BlogPost[]) => readonly BlogPost[]
): readonly BlogPost[] => {
    const scope = getTenantQueryScopeSnapshot();

    if (!scope.enabled) {
        return [];
    }

    const key = queryKeys.blog(scope.tenantKey);
    queryClient.setQueryData<readonly BlogPost[]>(key, (current) => updater(current ?? []));
    return queryClient.getQueryData<readonly BlogPost[]>(key) ?? [];
};

export const useBlogStore = create<BlogState>((set) => ({
    posts: [],
    currentPost: null,
    loading: false,
    errorMessage: null,

    fetchPosts: async () => {
        const scope = getTenantQueryScopeSnapshot();

        if (!scope.enabled) {
            set({ posts: [], currentPost: null });
            return;
        }

        set({ loading: true, errorMessage: null });

        try {
            const posts = await queryClient.fetchQuery({
                queryKey: queryKeys.blog(scope.tenantKey),
                queryFn: getAllPosts,
                staleTime: 15_000
            });
            set((state) => ({
                posts,
                currentPost: state.currentPost
                    ? posts.find((post) => post.id === state.currentPost?.id) ?? null
                    : null
            }));
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    selectPost: (post) => set({ currentPost: post }),

    likePost: async (id) => {
        const user = useAuthStore.getState().user;

        if (!user) {
            return;
        }

        const response = await togglePostLike(id);
        const posts = writeCachedPosts((current) => current.map((post) => {
            if (post.id !== id) {
                return post;
            }

            const likesUsers = response.liked
                ? [...post.likesUsers.filter((userId) => userId !== user.id), user.id]
                : post.likesUsers.filter((userId) => userId !== user.id);

            return { ...post, likes: response.likes, likesUsers };
        }));
        set((state) => ({
            posts,
            currentPost: state.currentPost
                ? posts.find((post) => post.id === state.currentPost?.id) ?? state.currentPost
                : null
        }));
    },

    commentOnPost: async (id, text) => {
        const comment = await commentOnPost(id, text);
        const posts = writeCachedPosts((current) => current.map((post) => post.id === id
            ? { ...post, comments: [...post.comments, comment] }
            : post));
        set((state) => ({
            posts,
            currentPost: state.currentPost
                ? posts.find((post) => post.id === state.currentPost?.id) ?? state.currentPost
                : null
        }));
    },

    addPost: async (payload) => {
        set({ loading: true, errorMessage: null });

        try {
            const created = await createPost(payload);
            const posts = writeCachedPosts((current) => upsertById(current, created));
            set({ posts });
            return true;
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    updatePost: async (id, payload) => {
        set({ loading: true, errorMessage: null });

        try {
            const updated = await updatePost(id, payload);
            const posts = writeCachedPosts((current) => upsertById(current, updated));
            set((state) => ({
                posts,
                currentPost: state.currentPost?.id === id ? updated : state.currentPost
            }));
            return true;
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            return false;
        } finally {
            set({ loading: false });
        }
    },

    deletePost: async (id) => {
        await deletePost(id);
        const posts = writeCachedPosts((current) => removeById(current, id));
        set((state) => ({
            posts,
            currentPost: state.currentPost?.id === id ? null : state.currentPost
        }));
    },

    reset: () => set({
        posts: readCachedPosts(),
        currentPost: null,
        loading: false,
        errorMessage: null
    })
}));
