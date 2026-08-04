// scripts/production-regressions.test.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8'
);

const multipart = read('src/services/multipart.ts');
const uploadServices = [
    'src/services/auth.ts',
    'src/services/announcement.ts',
    'src/services/blog.ts',
    'src/services/chat.ts',
    'src/services/choirs.ts',
    'src/services/gallery.ts',
    'src/services/song.ts',
    'src/services/admin/settings.ts',
    'src/services/admin/users.ts'
].map(read);
const chatStore = read('src/store/useChatStore.ts');
const chatScreen = read('src/screens/chat/ChatScreen.tsx');
const chatInput = read('src/components/chatMessages/ChatInput.tsx');
const tabsNavigator = read('src/navigation/TabsNavigator.tsx');
const songTypesScreen = read('src/screens/songs/SongTypesScreen.tsx');
const songsStore = read('src/store/useSongsStore.ts');
const galleryStore = read('src/store/useGalleryStore.ts');
const themeService = read('src/services/theme.ts');
const themeEditor = read('src/screens/settings/themes/ManageThemeScreen.tsx');
const blogStore = read('src/store/useBlogStore.ts');
const announcementStore = read('src/store/useAnnouncementStore.ts');
const blogEditor = read('src/screens/blog/CreateBlogScreen.tsx');
const announcementEditor = read('src/screens/CreateAnnouncementScreen.tsx');
const blogDetail = read('src/screens/blog/BlogDetailScreen.tsx');
const profileEditor = read('src/screens/settings/profile/EditProfileScreen.tsx');
const choirEditor = read('src/screens/choir/ManageChoirScreen.tsx');
const userEditor = read('src/screens/admin/ManageUserScreen.tsx');
const richTextViewer = read('src/components/common/RichTextViewer.tsx');

assert.doesNotMatch(multipart, /response\.blob\(\)/u);
assert.doesNotMatch(multipart, /fetch\(upload\.uri\)/u);
assert.match(multipart, /NativeFormDataFile/u);
assert.match(multipart, /nativeFormData\.append\(fieldName/u);
assert.match(multipart, /El archivo seleccionado está vacío/u);
assert.match(multipart, /createLocalUpload/u);

for (const service of uploadServices) {
    assert.match(service, /createLocalUpload/u);
    assert.match(service, /appendLocalFile/u);
}

assert.match(chatStore, /response\.data\.users/u);
assert.match(chatStore, /transports: \['websocket'\]/u);
assert.match(chatStore, /upgrade: false/u);
assert.match(chatStore, /DIRECTORY_TIMEOUT_MS/u);
assert.match(chatStore, /directoryLoaded/u);
assert.match(chatStore, /persistChatChanges\(\[toRawChatMessage\(message\)\]\)\.catch/u);
assert.doesNotMatch(chatStore, /await persistChatChanges\(\[toRawChatMessage\(message\)\]\)/u);
assert.match(chatStore, /connect_error/u);
assert.doesNotMatch(chatScreen, /Promise\.allSettled/u);
assert.match(chatScreen, /fetchDirectory\(\)\.catch/u);
assert.match(chatScreen, /keyboardVerticalOffset=\{0\}/u);
assert.match(chatScreen, /directoryLoading/u);
assert.match(chatInput, /Keyboard\.dismiss/u);
assert.match(chatInput, /ActivityIndicator/u);
assert.match(chatInput, /onFocus=\{onFocus\}/u);
assert.match(tabsNavigator, /tabBarHideOnKeyboard: true/u);

assert.match(songTypesScreen, /KeyboardAvoidingView/u);
assert.match(songTypesScreen, /keyboardDismissMode/u);
assert.match(songTypesScreen, /Ocultar teclado/u);
assert.match(songTypesScreen, /ActivityIndicator/u);
assert.match(songsStore, /upsertSongType/u);
assert.match(songsStore, /refreshInBackground/u);
assert.doesNotMatch(songsStore, /await get\(\)\.fetchData\(\)/u);
assert.match(galleryStore, /upsertImage/u);
assert.match(galleryStore, /refreshInBackground/u);
assert.doesNotMatch(galleryStore, /await get\(\)\.fetchImages\(\)/u);

assert.match(themeService, /THEME_MUTATION_TIMEOUT_MS = 6_000/u);
assert.match(themeEditor, /onCompleteJS=\{onColorSelect\}/u);
assert.doesNotMatch(themeEditor, /onComplete=\{onColorSelect\}/u);

assert.match(blogStore, /replacePost/u);
assert.match(blogStore, /hydratePostInBackground/u);
assert.match(blogStore, /refreshInBackground/u);
assert.match(announcementStore, /replaceAnnouncement/u);
assert.match(announcementStore, /hydrateAnnouncementInBackground/u);
assert.match(announcementStore, /refreshInBackground/u);

for (const source of [
    blogEditor,
    announcementEditor,
    blogDetail,
    profileEditor,
    choirEditor,
    userEditor
]) {
    assert.match(source, /KeyboardAvoidingView/u);
    assert.match(source, /automaticallyAdjustKeyboardInsets/u);
    assert.match(source, /autoCorrect/u);
    assert.match(source, /spellCheck/u);
}

assert.match(richTextViewer, /useTheme/u);
assert.match(richTextViewer, /colors\.textColor/u);
assert.match(richTextViewer, /SongContent/u);

console.log('Production regression contract tests passed.');
