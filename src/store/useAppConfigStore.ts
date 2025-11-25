import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings } from '../services/admin/settings';

interface AppConfigState {
    appTitle: string;
    appLogoUrl: string | null;
    socialLinks: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
        whatsapp?: string;
    };
    loading: boolean;
    fetchAppConfig: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>()(
    persist(
        (set) => ({
            appTitle: 'Coro App',
            appLogoUrl: null,
            socialLinks: {},
            loading: false,

            fetchAppConfig: async () => {
                set({ loading: true });
                try {
                    const data = await getSettings();
                    set({
                        appTitle: data.appTitle || 'Coro App',
                        appLogoUrl: data.appLogoUrl || null,
                        socialLinks: data.socialLinks || {}
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