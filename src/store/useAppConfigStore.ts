// src/store/useAppConfigStore.ts

import { create } from 'zustand';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';
import { getSettings } from '../services/admin/settings';
import type {
    AppSettings,
    HomeLegends,
    RichTextDocument,
    SocialLinks
} from '../types/settings';
import { getTenantQueryScopeSnapshot } from '../hooks/query/useTenantQueryScope';

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

const toState = (settings: AppSettings): Partial<AppConfigState> => ({
    appTitle: settings.webTitle || 'Choir App',
    appLogoUrl: settings.cachedLogoUrl ?? settings.logoUrl ?? null,
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
        const scope = getTenantQueryScopeSnapshot();

        if (!scope.enabled) {
            return;
        }

        set({ loading: true });

        try {
            const settings = await queryClient.fetchQuery({
                queryKey: queryKeys.settings(scope.tenantKey),
                queryFn: getSettings,
                staleTime: 5 * 60_000
            });
            set(toState(settings));
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
