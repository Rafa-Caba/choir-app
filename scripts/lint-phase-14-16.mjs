// scripts/lint-phase-14-16.mjs

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const targets = [
    'App.tsx',
    'src/api/choirApi.ts',
    'src/api/tenantContextBridge.ts',
    'src/auth/permissions.ts',
    'src/components/auth/AccessDeniedScreen.tsx',
    'src/components/chatMessages/ChatInput.tsx',
    'src/components/chatMessages/MessageDetailsModal.tsx',
    'src/components/common/RichTextViewer.tsx',
    'src/components/shared/MediaViewerModal.tsx',
    'src/components/home/HomeQuickMenuModal.tsx',
    'src/screens/CreateAnnouncementScreen.tsx',
    'src/screens/blog/BlogDetailScreen.tsx',
    'src/screens/blog/CreateBlogScreen.tsx',
    'src/screens/chat/ChatScreen.tsx',
    'src/screens/settings/profile/EditProfileScreen.tsx',
    'src/screens/settings/themes/ManageThemeScreen.tsx',
    'src/services/chat.ts',
    'src/services/multipart.ts',
    'src/services/notifications.ts',
    'src/store/useAnnouncementStore.ts',
    'src/store/useBlogStore.ts',
    'src/types/announcement.ts',
    'src/types/gallery.ts',
    'src/types/notification.ts',
    'src/utils/textUtils.ts',
    'src/hooks/usePushNotifications.ts',
    'src/navigation/AppNavigator.tsx',
    'src/navigation/BlogNavigator.tsx',
    'src/navigation/HomeNavigator.tsx',
    'src/navigation/PlatformNavigator.tsx',
    'src/navigation/SettingsNavigator.tsx',
    'src/navigation/SongsNavigator.tsx',
    'src/navigation/TabsNavigator.tsx',
    'src/screens/songs/SongTypesScreen.tsx',
    'src/store/useSongsStore.ts',
    'src/store/useGalleryStore.ts',
    'src/store/useThemeStore.ts',
    'src/services/theme.ts',
    'src/screens/admin/ManageUserScreen.tsx',
    'src/screens/admin/UsersListScreen.tsx',
    'src/screens/audit/AuditLogsScreen.tsx',
    'src/screens/choir/ChoirsListScreen.tsx',
    'src/screens/choir/ManageChoirScreen.tsx',
    'src/screens/platform/PlatformProfileScreen.tsx',
    'src/screens/settings/SettingsScreen.tsx',
    'src/services/admin/settings.ts',
    'src/services/admin/users.ts',
    'src/services/blog.ts',
    'src/services/auth.ts',
    'src/services/announcement.ts',
    'src/services/audit.ts',
    'src/services/gallery.ts',
    'src/services/choirs.ts',
    'src/services/song.ts',
    'src/services/sessionCleanup.ts',
    'src/store/useAdminChoirsStore.ts',
    'src/store/useAuthStore.ts',
    'src/store/useChatStore.ts',
    'src/store/useAdminUsersStore.ts',
    'src/store/useAuditLogsStore.ts',
    'src/store/useTargetChoirStore.ts',
    'src/types/audit.ts',
    'src/types/choir.ts',
    'src/types/auth.ts',
    'src/context/ThemeContext.tsx',
    'src/hooks/query/useAnnouncementData.ts',
    'src/hooks/query/useBlogData.ts',
    'src/hooks/query/useChatData.ts',
    'src/hooks/query/useGalleryData.ts',
    'src/storage/galleryMediaCache.ts',
    'src/storage/mediaStorage.ts',
    'src/hooks/query/useSongsData.ts',
    'src/hooks/query/useTenantQueryScope.ts',
    'src/hooks/query/useThemesData.ts',
    'src/hooks/query/useNotificationsData.ts',
    'src/providers/QueryLifecycleManager.tsx',
    'src/providers/QueryProvider.tsx',
    'src/query/cacheUpdates.ts',
    'src/query/chatCache.ts',
    'src/query/queryClient.ts',
    'src/query/queryKeys.ts',
    'src/screens/HomeScreen.tsx',
    'src/screens/blog/BlogListScreen.tsx',
    'src/screens/gallery/GalleryScreen.tsx',
    'src/screens/gallery/MediaDetailScreen.tsx',
    'src/screens/settings/AdminThemeEditorScreen.tsx',
    'src/screens/settings/themes/ThemeSelectionScreen.tsx',
    'src/screens/settings/themes/ThemesListScreen.tsx',
    'src/screens/songs/CreateSongScreen.tsx',
    'src/screens/songs/SongDetailScreen.tsx',
    'src/screens/songs/SongsListScreen.tsx',
    'src/services/deviceIdentity.ts',
    'src/services/pushDevices.ts',
    'src/store/useAppConfigStore.ts',
];

const prohibitedPatterns = [
    { label: 'explicit any type', expression: /\bany\b/u },
    { label: 'unsafe any assertion', expression: /as\s+any\b/u },
    { label: 'TypeScript ignore directive', expression: /@ts-ignore/u },
    { label: 'TypeScript expect-error directive', expression: /@ts-expect-error/u },
    { label: 'untyped external value', expression: new RegExp(`\\b${'un' + 'known'}\\b`, 'u') }
];

const failures = [];

for (const relativePath of targets) {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');

    for (const pattern of prohibitedPatterns) {
        if (pattern.expression.test(source)) {
            failures.push(`${relativePath}: ${pattern.label}`);
        }
    }
}

if (failures.length > 0) {
    console.error('Phase 14-16 lint failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log(`Phase 14-16 lint passed for ${targets.length} RN files.`);
