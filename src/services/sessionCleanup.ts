// src/services/sessionCleanup.ts

import type { TenantStorageContext } from '../types/sync';
import { queryClient } from '../query/queryClient';
import { clearTenantMediaCache } from '../storage/mediaCache';
import {
    clearLegacyStorage,
    clearPersistedSessionContext,
    clearTenantStorage
} from '../storage/tenantStorage';

export const resetApplicationStores = async (): Promise<void> => {
    queryClient.clear();
    const [
        announcementModule,
        appConfigModule,
        blogModule,
        chatModule,
        galleryModule,
        songsModule,
        themeModule,
        adminChoirsModule,
        adminThemesModule,
        adminUsersModule,
        auditLogsModule,
        targetChoirModule
    ] = await Promise.all([
        import('../store/useAnnouncementStore'),
        import('../store/useAppConfigStore'),
        import('../store/useBlogStore'),
        import('../store/useChatStore'),
        import('../store/useGalleryStore'),
        import('../store/useSongsStore'),
        import('../store/useThemeStore'),
        import('../store/useAdminChoirsStore'),
        import('../store/useAdminThemesStore'),
        import('../store/useAdminUsersStore'),
        import('../store/useAuditLogsStore'),
        import('../store/useTargetChoirStore')
    ]);

    chatModule.useChatStore.getState().disconnect();
    announcementModule.useAnnouncementStore.getState().reset();
    appConfigModule.useAppConfigStore.getState().reset();
    blogModule.useBlogStore.getState().reset();
    chatModule.useChatStore.getState().reset();
    galleryModule.useGalleryStore.getState().reset();
    songsModule.useSongsStore.getState().reset();
    themeModule.useThemeStore.getState().reset();
    adminChoirsModule.useAdminChoirsStore.getState().reset();
    adminThemesModule.useAdminThemesStore.getState().reset();
    adminUsersModule.useAdminUsersStore.getState().reset();
    auditLogsModule.useAuditLogsStore.getState().reset();
    targetChoirModule.useTargetChoirStore.getState().clearSelection();
};

export const clearLocalSessionData = async (
    context: TenantStorageContext | null
): Promise<void> => {
    await resetApplicationStores();

    if (context) {
        await clearTenantMediaCache(context);
        await clearTenantStorage(context);
    }

    await Promise.all([
        clearPersistedSessionContext(),
        clearLegacyStorage()
    ]);
};
