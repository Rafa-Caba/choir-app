import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './useAuthStore';

import {
    getPublicPosts,
    getAllPosts,
    likePost,
    commentOnPost,
    createPost as createPostService,
    deletePost,
    updatePost as updatePostService
} from '../services/blog';

import type { BlogPost, CreateBlogPayload } from '../types/blog';

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
}

export const useBlogStore = create<BlogState>()(
    persist(
        (set, get) => ({
            posts: [],
            currentPost: null,
            loading: false,

            fetchPosts: async () => {
                set({ loading: true });
                try {
                    const { user } = useAuthStore.getState();
                    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

                    const data = isAdmin ? await getAllPosts() : await getPublicPosts();
                    set({ posts: Array.isArray(data) ? data : [] });
                } catch (e) {
                    console.log("Offline: Keeping cached blog posts");
                } finally {
                    set({ loading: false });
                }
            },

            selectPost: (post) => set({ currentPost: post }),

            likePost: async (id) => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                try {
                    // Optimistic Update
                    set((state) => {
                        const updateLogic = (p: BlogPost) => {
                            if (p.id !== id) return p;
                            const isLiked = p.likesUsers.includes(user.id); // Check by ID
                            return {
                                ...p,
                                likes: isLiked ? p.likes - 1 : p.likes + 1,
                                likesUsers: isLiked
                                    ? p.likesUsers.filter(uid => uid !== user.id)
                                    : [...p.likesUsers, user.id]
                            };
                        };

                        const newPosts = state.posts.map(updateLogic);
                        const newCurrent = state.currentPost?.id === id
                            ? updateLogic(state.currentPost)
                            : state.currentPost;

                        return { posts: newPosts, currentPost: newCurrent };
                    });

                    // API Call
                    const updated = await likePost(id, user.id);

                    // Sync
                    set((state) => ({
                        posts: state.posts.map(p => p.id === id ? updated : p),
                        currentPost: state.currentPost?.id === id ? updated : state.currentPost
                    }));
                } catch (e) { console.error("Like failed", e); }
            },

            commentOnPost: async (id, text) => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                try {
                    // Backend expects simple text which it converts to TipTap, or we send TipTap directly?
                    // Service takes string, let's rely on Service/Backend logic.
                    const updated = await commentOnPost(id, text, user.username);

                    set((state) => ({
                        posts: state.posts.map(p => p.id === id ? updated : p),
                        currentPost: state.currentPost?.id === id ? updated : state.currentPost
                    }));
                } catch (e) { console.error("Comment failed", e); }
            },

            addPost: async (payload) => {
                set({ loading: true });
                try {
                    await createPostService(payload);
                    await get().fetchPosts();
                    return true;
                } catch (e) {
                    console.error("Create failed", e);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            updatePost: async (id, payload) => {
                set({ loading: true });
                try {
                    await updatePostService(id, payload);
                    await get().fetchPosts();
                    return true;
                } catch (e) {
                    console.error("Update failed", e);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            deletePost: async (id) => {
                try {
                    await deletePost(id);
                    set((state) => ({
                        posts: state.posts.filter(p => p.id !== id),
                        currentPost: null
                    }));
                } catch (e) { console.error("Delete failed", e); }
            }
        }),
        {
            name: 'blog-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ posts: state.posts, currentPost: null }),
        }
    )
);