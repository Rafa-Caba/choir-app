// src/store/useAppConfigStore.ts

import { create } from 'zustand';
import { CACHE_TTL_MS } from '../config/cachePolicy';
import { syncCacheFirst } from '../services/sync';
import { cacheRemoteMedia } from '../storage/mediaCache';
import type {
    AppSettings,
    HomeLegends,
    RichTextDocument,
    SocialLinks
} from '../types/settings';
import { useAuthStore } from './useAuthStore';

const EMPTY_SOCIALS: SocialLinks = {
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
    email: ''
};

const EMPTY_LEGENDS: HomeLegends = {
    principal: '',
    secondary: ''
};

const EMPTY_HISTORY: RichTextDocument = {
    type: 'doc',
    content: []
};

interface AppConfigState {
    appTitle: string;
    appLogoUrl: string | null;
    contactPhone: string;
    socialLinks: SocialLinks;
    homeLegends: HomeLegends;
    history: RichTextDocument;
    loading: boolean;
    fetchAppConfig: () => Promise<void>;
    reset: () => void;
}

const toState = (settings: AppSettings, cachedLogoUrl?: string | null): Partial<AppConfigState> => ({
    appTitle: settings.webTitle || 'Choir App',
    appLogoUrl: cachedLogoUrl ?? settings.logoUrl ?? null,
    contactPhone: settings.contactPhone || '',
    socialLinks: settings.socials ?? EMPTY_SOCIALS,
    homeLegends: settings.homeLegends ?? EMPTY_LEGENDS,
    history: settings.history ?? EMPTY_HISTORY
});

export const useAppConfigStore = create<AppConfigState>((set) => ({
    appTitle: 'Choir App',
    appLogoUrl: null,
    contactPhone: '',
    socialLinks: EMPTY_SOCIALS,
    homeLegends: EMPTY_LEGENDS,
    history: EMPTY_HISTORY,
    loading: false,

    fetchAppConfig: async () => {
        const context = useAuthStore.getState().getTenantContext();
        if (!context) return;
        set({ loading: true });

        try {
            const result = await syncCacheFirst<AppSettings>({
                context,
                resource: 'settings',
                path: '/settings',
                ttlMs: CACHE_TTL_MS.settings,
                onData: (data) => set(toState(data))
            });
            const cachedLogoUrl = await cacheRemoteMedia(
                context,
                'settings',
                result.data.logoUrl
            );
            set(toState(result.data, cachedLogoUrl));
        } finally {
            set({ loading: false });
        }
    },

    reset: () => set({
        appTitle: 'Choir App',
        appLogoUrl: null,
        contactPhone: '',
        socialLinks: EMPTY_SOCIALS,
        homeLegends: EMPTY_LEGENDS,
        history: EMPTY_HISTORY,
        loading: false
    })
}));
