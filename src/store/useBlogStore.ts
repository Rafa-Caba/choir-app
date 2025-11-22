import { create } from 'zustand';
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

export const useBlogStore = create<BlogState>((set, get) => ({
    posts: [],
    currentPost: null,
    loading: false,

    fetchPosts: async () => {
        set({ loading: true });
        try {
            const data = await getPublicPosts();
            set({ posts: data });
        } finally {
            set({ loading: false });
        }
    },

    selectPost: (post) => set({ currentPost: post }),

    likePost: async (id) => {
        // Optimistic update could go here
        const updated = await toggleLike(id);
        set((state) => ({
            posts: state.posts.map(p => p.id === id ? updated : p),
            currentPost: state.currentPost?.id === id ? updated : state.currentPost
        }));
    },

    commentOnPost: async (id, text) => {
        const updated = await addComment(id, text);
        set((state) => ({
            posts: state.posts.map(p => p.id === id ? updated : p),
            currentPost: state.currentPost?.id === id ? updated : state.currentPost
        }));
    },

    addPost: async (payload) => {
        set({ loading: true });
        try {
            await createPost(payload);
            await get().fetchPosts();
            return true;
        } catch (e) {
            return false;
        } finally {
            set({ loading: false });
        }
    }
}));