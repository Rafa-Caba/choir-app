// src/store/useBlogStore.ts

import { create } from 'zustand';
import {
    commentOnPost,
    createPost,
    deletePost,
    togglePostLike,
    updatePost
} from '../services/blog';
import { getApiErrorMessage } from '../services/auth';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type { BlogPost, CreateBlogPayload } from '../types/blog';
import { useAuthStore } from './useAuthStore';

interface BlogState {
    posts: BlogPost[];
    currentPost: BlogPost | null;
    loading: boolean;
    errorMessage: string | null;
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

const replacePost = (
    posts: readonly BlogPost[],
    incoming: BlogPost
): BlogPost[] => {
    const existing = posts.find((post) => post.id === incoming.id);
    const merged = existing
        ? {
            ...existing,
            ...incoming,
            cachedImageUrl: incoming.cachedImageUrl ?? (
                existing.imageUrl === incoming.imageUrl
                    ? existing.cachedImageUrl
                    : null
            )
        }
        : incoming;

    return existing
        ? posts.map((post) => post.id === incoming.id ? merged : post)
        : [merged, ...posts];
};

export const useBlogStore = create<BlogState>((set) => {
    const syncPosts = async (showLoading: boolean): Promise<void> => {
        const context = useAuthStore.getState().getTenantContext();

        if (!context) {
            return;
        }

        if (showLoading) {
            set({ loading: true, errorMessage: null });
        }

        try {
            const result = await syncCacheFirst<readonly BlogPost[]>({
                context,
                resource: 'blog',
                path: '/blog',
                ttlMs: CACHE_TTL_MS.blog,
                onData: (data) => set({ posts: [...data] })
            });
            const rawPosts = [...result.data];
            set((state) => ({
                posts: rawPosts,
                currentPost: state.currentPost
                    ? rawPosts.find((post) => post.id === state.currentPost?.id) ?? state.currentPost
                    : null
            }));

            hydratePosts(rawPosts)
                .then((hydrated) => set((state) => ({
                    posts: hydrated.reduce<BlogPost[]>(
                        (current, post) => replacePost(current, post),
                        state.posts
                    ),
                    currentPost: state.currentPost
                        ? hydrated.find((post) => post.id === state.currentPost?.id) ?? state.currentPost
                        : null
                })))
                .catch(() => undefined);
        } catch (error) {
            set({ errorMessage: getApiErrorMessage(error as object) });
            throw error;
        } finally {
            if (showLoading) {
                set({ loading: false });
            }
        }
    };

    const refreshInBackground = (): void => {
        syncPosts(false).catch(() => undefined);
    };

    const hydratePostInBackground = (post: BlogPost): void => {
        hydratePosts([post])
            .then(([hydrated]) => set((state) => ({
                posts: replacePost(state.posts, hydrated),
                currentPost: state.currentPost?.id === hydrated.id
                    ? hydrated
                    : state.currentPost
            })))
            .catch(() => undefined);
    };

    return {
        posts: [],
        currentPost: null,
        loading: false,
        errorMessage: null,

        fetchPosts: () => syncPosts(true),

        selectPost: (post) => set({ currentPost: post }),

        likePost: async (id) => {
            const user = useAuthStore.getState().user;

            if (!user) {
                return;
            }

            const response = await togglePostLike(id);
            const update = (post: BlogPost): BlogPost => {
                if (post.id !== id) {
                    return post;
                }

                const likedUsers = response.liked
                    ? [...post.likesUsers.filter((userId) => userId !== user.id), user.id]
                    : post.likesUsers.filter((userId) => userId !== user.id);

                return { ...post, likes: response.likes, likesUsers: likedUsers };
            };

            set((state) => ({
                posts: state.posts.map(update),
                currentPost: state.currentPost ? update(state.currentPost) : null
            }));
        },

        commentOnPost: async (id, text) => {
            const comment = await commentOnPost(id, text);
            const update = (post: BlogPost): BlogPost => post.id === id
                ? { ...post, comments: [...post.comments, comment] }
                : post;

            set((state) => ({
                posts: state.posts.map(update),
                currentPost: state.currentPost ? update(state.currentPost) : null
            }));
        },

        addPost: async (payload) => {
            set({ loading: true, errorMessage: null });

            try {
                const created = await createPost(payload);
                set((state) => ({ posts: replacePost(state.posts, created) }));
                hydratePostInBackground(created);
                refreshInBackground();
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
                set((state) => ({
                    posts: replacePost(state.posts, updated),
                    currentPost: state.currentPost?.id === id ? updated : state.currentPost
                }));
                hydratePostInBackground(updated);
                refreshInBackground();
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
            set((state) => ({
                posts: state.posts.filter((post) => post.id !== id),
                currentPost: state.currentPost?.id === id ? null : state.currentPost
            }));
            refreshInBackground();
        },

        reset: () => set({
            posts: [],
            currentPost: null,
            loading: false,
            errorMessage: null
        })
    };
});
