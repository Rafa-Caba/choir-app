// src/store/useBlogStore.ts

import { create } from 'zustand';
import {
    commentOnPost,
    createPost,
    deletePost,
    togglePostLike,
    updatePost
} from '../services/blog';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type { BlogPost, CreateBlogPayload } from '../types/blog';
import { useAuthStore } from './useAuthStore';

interface BlogState {
    posts: BlogPost[];
    currentPost: BlogPost | null;
    loading: boolean;
    fetchPosts: () => Promise<void>;
    selectPost: (post: BlogPost) => void;
    likePost: (id: string) => Promise<void>;
    commentOnPost: (id: string, text: string) => Promise<void>;
    addPost: (payload: CreateBlogPayload) => Promise<boolean>;
    updatePost: (id: string, payload: Partial<CreateBlogPayload>) => Promise<boolean>;
    deletePost: (id: string) => Promise<void>;
    reset: () => void;
}

const hydratePosts = async (posts: readonly BlogPost[]): Promise<BlogPost[]> => {
    const context = useAuthStore.getState().getTenantContext();

    if (!context) {
        return [...posts];
    }

    return Promise.all(posts.map(async (post) => ({
        ...post,
        cachedImageUrl: await cacheRemoteMedia(context, 'blog', post.imageUrl)
    })));
};

export const useBlogStore = create<BlogState>((set, get) => ({
    posts: [],
    currentPost: null,
    loading: false,

    fetchPosts: async () => {
        const context = useAuthStore.getState().getTenantContext();
        if (!context) return;
        set({ loading: true });

        try {
            const result = await syncCacheFirst<readonly BlogPost[]>({
                context,
                resource: 'blog',
                path: '/blog',
                ttlMs: CACHE_TTL_MS.blog,
                onData: (data) => set({ posts: [...data] })
            });
            const hydrated = await hydratePosts(result.data);
            set((state) => ({
                posts: hydrated,
                currentPost: state.currentPost
                    ? hydrated.find((post) => post.id === state.currentPost?.id) ?? null
                    : null
            }));
        } finally {
            set({ loading: false });
        }
    },

    selectPost: (post) => set({ currentPost: post }),

    likePost: async (id) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const response = await togglePostLike(id);
        const update = (post: BlogPost): BlogPost => {
            if (post.id !== id) return post;
            const likedUsers = response.liked
                ? [...post.likesUsers.filter((userId) => userId !== user.id), user.id]
                : post.likesUsers.filter((userId) => userId !== user.id);
            return { ...post, likes: response.likes, likesUsers: likedUsers };
        };

        set((state) => ({
            posts: state.posts.map(update),
            currentPost: state.currentPost ? update(state.currentPost) : null
        }));
        await get().fetchPosts();
    },

    commentOnPost: async (id, text) => {
        await commentOnPost(id, text);
        await get().fetchPosts();
    },

    addPost: async (payload) => {
        set({ loading: true });
        try {
            await createPost(payload);
            await get().fetchPosts();
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    updatePost: async (id, payload) => {
        set({ loading: true });
        try {
            await updatePost(id, payload);
            await get().fetchPosts();
            return true;
        } catch {
            return false;
        } finally {
            set({ loading: false });
        }
    },

    deletePost: async (id) => {
        await deletePost(id);
        await get().fetchPosts();
    },

    reset: () => set({ posts: [], currentPost: null, loading: false })
}));
