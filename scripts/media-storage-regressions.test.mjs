// scripts/media-storage-regressions.test.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8'
);

const sourceFiles = [
    'src/components/chatMessages/MessageContent.tsx',
    'src/components/shared/MediaActionsModal.tsx',
    'src/components/shared/MediaViewerModal.tsx',
    'src/hooks/query/useChatData.ts',
    'src/hooks/query/useTenantQueryScope.ts',
    'src/hooks/useMediaResource.ts',
    'src/navigation/ChatNavigator.tsx',
    'src/navigation/SettingsNavigator.tsx',
    'src/navigation/TabsNavigator.tsx',
    'src/screens/chat/ChatMediaScreen.tsx',
    'src/screens/chat/ChatScreen.tsx',
    'src/screens/gallery/MediaDetailScreen.tsx',
    'src/screens/settings/MediaStorageScreen.tsx',
    'src/services/mediaActions.ts',
    'src/services/sessionCleanup.ts',
    'src/storage/mediaCache.ts',
    'src/storage/mediaStorage.ts',
    'src/storage/mediaStoragePreferences.ts',
    'src/types/chat.ts',
    'src/types/mediaStorage.ts',
    'src/types/sync.ts',
    'src/utils/normalizeChatMessage.ts'
];

for (const relativePath of sourceFiles) {
    const source = read(relativePath);
    assert.match(source, /^\/\//u, `${relativePath} must start with its file path comment`);
    assert.doesNotMatch(source, /\bas any\b/u, `${relativePath} must not use as any`);
    assert.doesNotMatch(source, /:\s*any\b/u, `${relativePath} must not use any`);
    assert.doesNotMatch(source, /<any>/u, `${relativePath} must not use any generics`);
    assert.doesNotMatch(source, /\bunknown\b/u, `${relativePath} must not use unknown`);
    assert.doesNotMatch(source, /@ts-ignore/u, `${relativePath} must not suppress TypeScript errors`);
}

const packageJson = JSON.parse(read('package.json'));
const appConfig = read('app.config.ts');
const easConfig = JSON.parse(read('eas.json'));
const mediaStorage = read('src/storage/mediaStorage.ts');
const mediaPreferences = read('src/storage/mediaStoragePreferences.ts');
const mediaActions = read('src/services/mediaActions.ts');
const mediaViewer = read('src/components/shared/MediaViewerModal.tsx');
const messageContent = read('src/components/chatMessages/MessageContent.tsx');
const mediaScreen = read('src/screens/chat/ChatMediaScreen.tsx');
const mediaSettings = read('src/screens/settings/MediaStorageScreen.tsx');
const chatScreen = read('src/screens/chat/ChatScreen.tsx');
const chatNavigator = read('src/navigation/ChatNavigator.tsx');
const tabsNavigator = read('src/navigation/TabsNavigator.tsx');
const settingsNavigator = read('src/navigation/SettingsNavigator.tsx');
const settingsScreen = read('src/screens/settings/SettingsScreen.tsx');
const chatData = read('src/hooks/query/useChatData.ts');
const chatTypes = read('src/types/chat.ts');
const normalizer = read('src/utils/normalizeChatMessage.ts');
const sessionCleanup = read('src/services/sessionCleanup.ts');

assert.equal(packageJson.dependencies['expo-media-library'], '~17.0.6');
assert.equal(packageJson.dependencies['expo-network'], '~7.0.5');
assert.match(appConfig, /version: '1\.0\.5'/u);
assert.match(appConfig, /'expo-media-library'/u);
assert.match(appConfig, /'expo-file-system'/u);
assert.match(appConfig, /supportsOpeningDocumentsInPlace: true/u);
assert.match(appConfig, /enableFileSharing: true/u);
assert.match(appConfig, /NSPhotoLibraryAddUsageDescription/u);
assert.equal(easConfig.build.production.autoIncrement, true);
assert.equal(easConfig.build['production-apk'].autoIncrement, true);

assert.match(mediaStorage, /createDownloadResumable/u);
assert.match(mediaStorage, /\.part/u);
assert.match(mediaStorage, /activeDownloads/u);
assert.match(mediaStorage, /cleanupExpiredTemporaryMedia/u);
assert.match(mediaStorage, /NetworkStateType\.WIFI/u);
assert.match(mediaStorage, /buildTenantMediaDirectory/u);
assert.match(mediaPreferences, /WIFI_ONLY/u);
assert.match(mediaActions, /MediaLibrary\.requestPermissionsAsync\(true\)/u);
assert.match(mediaActions, /MediaLibrary\.saveToLibraryAsync/u);
assert.match(mediaActions, /Sharing\.shareAsync/u);
assert.match(mediaViewer, /MediaActionsModal/u);
assert.doesNotMatch(messageContent, /Linking\.openURL/u);
assert.match(messageContent, /MediaActionsModal/u);
assert.match(messageContent, /useMediaResource/u);

assert.match(chatData, /resource: 'chat-media'/u);
assert.match(chatData, /path: '\/chat\/media'/u);
assert.match(chatTypes, /ChatMediaMetadata/u);
assert.match(normalizer, /normalizeMedia/u);
assert.match(normalizer, /raw\.imageUrl \|\| raw\.audioUrl \|\| raw\.fileUrl/u);
assert.match(mediaScreen, /Fotos y videos/u);
assert.match(chatScreen, /navigation\.navigate\('ChatMediaScreen'\)/u);
assert.match(chatNavigator, /ChatMediaScreen/u);
assert.match(tabsNavigator, /ChatNavigator/u);
assert.match(mediaSettings, /Descarga automática/u);
assert.match(mediaSettings, /Borrar caché/u);
assert.match(settingsNavigator, /MediaStorageScreen/u);
assert.match(settingsScreen, /Multimedia y almacenamiento/u);
assert.match(sessionCleanup, /await clearTenantMediaCache\(context\);/u);
assert.match(sessionCleanup, /await clearTenantStorage\(context\);/u);

console.log('Multimedia and storage regression contract tests passed.');
