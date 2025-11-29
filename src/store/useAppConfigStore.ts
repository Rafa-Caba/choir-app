import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings } from '../services/admin/settings';
import type { SocialLinks, HomeLegends } from '../types/settings';

interface AppConfigState {
    appTitle: string;
    appLogoUrl: string | null;
    contactPhone: string;

    socialLinks: SocialLinks;
    homeLegends: HomeLegends;
    history: any; // TipTap JSON

    loading: boolean;
    fetchAppConfig: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>()(
    persist(
        (set) => ({
            appTitle: 'Coro App',
            appLogoUrl: null,
            contactPhone: '',

            // Default empty structure
            socialLinks: {
                facebook: '',
                instagram: '',
                youtube: '',
                whatsapp: '',
                email: ''
            },
            homeLegends: {
                principal: '',
                secondary: ''
            },
            history: { type: 'doc', content: [] },

            loading: false,

            fetchAppConfig: async () => {
                set({ loading: true });
                try {
                    const data = await getSettings();

                    set({
                        appTitle: data.webTitle || 'Coro App',
                        appLogoUrl: data.logoUrl || null,
                        contactPhone: data.contactPhone || '',

                        socialLinks: {
                            facebook: data.socials?.facebook || '',
                            instagram: data.socials?.instagram || '',
                            youtube: data.socials?.youtube || '',
                            whatsapp: data.socials?.whatsapp || '',
                            email: data.socials?.email || ''
                        },

                        homeLegends: {
                            principal: data.homeLegends?.principal || '',
                            secondary: data.homeLegends?.secondary || ''
                        },

                        history: data.history || { type: 'doc', content: [] }
                    });
                } catch (error) {
                    console.log("Offline: Using cached app config");
                } finally {
                    set({ loading: false });
                }
            }
        }),
        {
            name: 'app-config-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);