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
    'src/components/common/RichTextViewer.tsx',
    'src/screens/CreateAnnouncementScreen.tsx',
    'src/screens/blog/BlogDetailScreen.tsx',
    'src/screens/blog/CreateBlogScreen.tsx',
    'src/screens/chat/ChatScreen.tsx',
    'src/screens/settings/profile/EditProfileScreen.tsx',
    'src/screens/settings/themes/ManageThemeScreen.tsx',
    'src/services/chat.ts',
    'src/services/multipart.ts',
    'src/store/useAnnouncementStore.ts',
    'src/store/useBlogStore.ts',
    'src/types/announcement.ts',
    'src/utils/textUtils.ts',
    'src/hooks/usePushNotifications.ts',
    'src/navigation/AppNavigator.tsx',
    'src/navigation/BlogNavigator.tsx',
    'src/navigation/HomeNavigator.tsx',
    'src/navigation/PlatformNavigator.tsx',
    'src/navigation/SettingsNavigator.tsx',
    'src/navigation/SongsNavigator.tsx',
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
    'src/types/auth.ts'
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
