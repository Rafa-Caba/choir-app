import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPublicPosts, toggleLike, addComment, createPost } from '../services/blog';
import type { BlogPost, CreateBlogPayload } from '../types/blog';

interface BlogState {
    posts: BlogPost[];
    currentPost: BlogPost | null;
    loading: boolean;
    
    fetchPosts: () => Promise<void>;
    selectPost: (post: BlogPost) => void;
    
    likePost: (id: number) => Promise<void>;
    commentOnPost: (id: number, text: string) => Promise<void>;
    addPost: (payload: CreateBlogPayload) => Promise<boolean>;
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
                    const data = await getPublicPosts();
                    set({ posts: data });
                } catch (e) {
                    console.log("Offline: Keeping cached blog posts");
                } finally {
                    set({ loading: false });
                }
            },

            selectPost: (post) => set({ currentPost: post }),

            likePost: async (id) => {
                try {
                    const updated = await toggleLike(id);
                    set((state) => ({
                        posts: state.posts.map(p => p.id === id ? updated : p),
                        currentPost: state.currentPost?.id === id ? updated : state.currentPost
                    }));
                } catch (e) {
                    console.error("Failed to like post", e);
                }
            },

            commentOnPost: async (id, text) => {
                try {
                    const updated = await addComment(id, text);
                    set((state) => ({
                        posts: state.posts.map(p => p.id === id ? updated : p),
                        currentPost: state.currentPost?.id === id ? updated : state.currentPost
                    }));
                } catch (e) {
                    console.error("Failed to post comment", e);
                }
            },

            addPost: async (payload) => {
                set({ loading: true });
                try {
                    await createPost(payload);
                    await get().fetchPosts();
                    return true;
                } catch (e) {
                    console.error("Failed to create post", e);
                    return false;
                } finally {
                    set({ loading: false });
                }
            }
        }),
        {
            name: 'blog-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ posts: state.posts, currentPost: state.currentPost }),
        }
    )
);