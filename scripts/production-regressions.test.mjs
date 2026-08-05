// scripts/production-regressions.test.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8'
);

const changedSources = [
    'App.tsx',
    'src/context/ThemeContext.tsx',
    'src/hooks/query/useAnnouncementData.ts',
    'src/hooks/query/useBlogData.ts',
    'src/hooks/query/useChatData.ts',
    'src/hooks/query/useGalleryData.ts',
    'src/hooks/query/useSongsData.ts',
    'src/hooks/query/useTenantQueryScope.ts',
    'src/hooks/query/useThemesData.ts',
    'src/hooks/usePushNotifications.ts',
    'src/navigation/BlogNavigator.tsx',
    'src/providers/QueryLifecycleManager.tsx',
    'src/providers/QueryProvider.tsx',
    'src/query/cacheUpdates.ts',
    'src/query/chatCache.ts',
    'src/query/queryClient.ts',
    'src/query/queryKeys.ts',
    'src/screens/CreateAnnouncementScreen.tsx',
    'src/screens/HomeScreen.tsx',
    'src/screens/blog/BlogDetailScreen.tsx',
    'src/screens/blog/BlogListScreen.tsx',
    'src/screens/blog/CreateBlogScreen.tsx',
    'src/screens/chat/ChatScreen.tsx',
    'src/screens/gallery/GalleryScreen.tsx',
    'src/screens/gallery/MediaDetailScreen.tsx',
    'src/screens/platform/PlatformProfileScreen.tsx',
    'src/screens/settings/AdminThemeEditorScreen.tsx',
    'src/screens/settings/themes/ManageThemeScreen.tsx',
    'src/screens/settings/themes/ThemeSelectionScreen.tsx',
    'src/screens/settings/themes/ThemesListScreen.tsx',
    'src/screens/songs/CreateSongScreen.tsx',
    'src/screens/songs/SongDetailScreen.tsx',
    'src/screens/songs/SongTypesScreen.tsx',
    'src/screens/songs/SongsListScreen.tsx',
    'src/services/auth.ts',
    'src/services/chat.ts',
    'src/services/deviceIdentity.ts',
    'src/services/pushDevices.ts',
    'src/services/sessionCleanup.ts',
    'src/services/song.ts',
    'src/services/theme.ts',
    'src/store/useAnnouncementStore.ts',
    'src/store/useAppConfigStore.ts',
    'src/store/useBlogStore.ts',
    'src/store/useChatStore.ts',
    'src/store/useGalleryStore.ts',
    'src/store/useSongsStore.ts',
    'src/store/useThemeStore.ts'
];

for (const relativePath of changedSources) {
    const source = read(relativePath);
    assert.match(source, /^\/\//u, `${relativePath} must start with its file path comment`);
    assert.doesNotMatch(source, /\bas any\b/u, `${relativePath} must not use as any`);
    assert.doesNotMatch(source, /:\s*any\b/u, `${relativePath} must not use any`);
    assert.doesNotMatch(source, /<any>/u, `${relativePath} must not use any generics`);
    assert.doesNotMatch(source, /@ts-ignore/u, `${relativePath} must not suppress TypeScript errors`);
}

const app = read('App.tsx');
const packageJson = JSON.parse(read('package.json'));
const queryClient = read('src/query/queryClient.ts');
const queryLifecycle = read('src/providers/QueryLifecycleManager.tsx');
const queryKeys = read('src/query/queryKeys.ts');
const blogStore = read('src/store/useBlogStore.ts');
const announcementStore = read('src/store/useAnnouncementStore.ts');
const chatStore = read('src/store/useChatStore.ts');
const chatScreen = read('src/screens/chat/ChatScreen.tsx');
const chatData = read('src/hooks/query/useChatData.ts');
const chatInput = read('src/components/chatMessages/ChatInput.tsx');
const authService = read('src/services/auth.ts');
const songTypesScreen = read('src/screens/songs/SongTypesScreen.tsx');
const galleryScreen = read('src/screens/gallery/GalleryScreen.tsx');
const songService = read('src/services/song.ts');
const platformProfile = read('src/screens/platform/PlatformProfileScreen.tsx');
const pushDevices = read('src/services/pushDevices.ts');
const deviceIdentity = read('src/services/deviceIdentity.ts');
const multipart = read('src/services/multipart.ts');

assert.equal(typeof packageJson.dependencies['@tanstack/react-query'], 'string');
assert.match(app, /<QueryProvider>/u);
assert.match(app, /<QueryLifecycleManager>/u);
assert.match(app, /useChatStore/u);
assert.match(app, /connectChat\(\)/u);
assert.match(queryClient, /staleTime: 15_000/u);
assert.match(queryLifecycle, /focusManager\.setFocused/u);
assert.match(queryKeys, /\['tenant', tenantKey/u);

assert.doesNotMatch(blogStore, /syncCacheFirst/u);
assert.doesNotMatch(announcementStore, /syncCacheFirst/u);
assert.match(blogStore, /queryClient\.fetchQuery/u);
assert.match(announcementStore, /queryClient\.fetchQuery/u);

assert.match(chatStore, /transports: \['polling'\]/u);
assert.match(chatStore, /upgrade: false/u);
assert.match(chatStore, /tryAllTransports: false/u);
assert.match(chatStore, /connectionKey/u);
assert.match(chatStore, /queryClient\.setQueryData/u);
assert.match(chatData, /refetchInterval: active && !connected \? 15_000 : false/u);
assert.match(chatData, /timeout: 6_000/u);
assert.match(chatData, /signal/u);
assert.match(chatScreen, /KeyboardAvoidingView/u);
assert.match(chatScreen, /keyboardVerticalOffset=\{0\}/u);
assert.match(chatScreen, /onScrollBeginDrag=\{Keyboard\.dismiss\}/u);
assert.match(chatScreen, /useIsFocused/u);
assert.doesNotMatch(chatScreen, /composerDock/u);
assert.match(chatInput, /Keyboard\.dismiss/u);
assert.match(chatInput, /pendingPickerAction/u);
assert.match(chatInput, /prepareToRecordAsync/u);
assert.match(chatInput, /onPress=\{\(\) => void handleRecordingPress\(\)\}/u);
assert.match(chatInput, /ActivityIndicator/u);

assert.match(songTypesScreen, /KeyboardAvoidingView/u);
assert.match(songTypesScreen, /onScrollBeginDrag=\{Keyboard\.dismiss\}/u);
assert.doesNotMatch(songTypesScreen, /InputAccessoryView/u);
assert.doesNotMatch(songTypesScreen, /Ocultar teclado/u);

assert.match(galleryScreen, /KeyboardAvoidingView/u);
assert.match(galleryScreen, /onScrollBeginDrag=\{Keyboard\.dismiss\}/u);
assert.match(galleryScreen, /maxHeight: '90%'/u);
assert.match(songService, /normalizeSongType/u);
assert.match(songService, /resolveParentId/u);

assert.match(platformProfile, /ImagePicker\.launchImageLibraryAsync/u);
assert.match(platformProfile, /Cambiar foto de plataforma/u);
assert.match(platformProfile, /updateUserProfile\(/u);

assert.match(pushDevices, /REGISTRATION_RETRY_COOLDOWN_MS/u);
assert.match(authService, /timeout: 6_000/u);
assert.match(deviceIdentity, /deviceIdPromise/u);
assert.doesNotMatch(multipart, /response\.blob\(\)/u);
assert.doesNotMatch(multipart, /fetch\(upload\.uri\)/u);
assert.match(multipart, /El archivo seleccionado está vacío/u);

console.log('Production and performance regression contract tests passed.');
