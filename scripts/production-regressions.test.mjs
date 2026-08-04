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
assert.match(chatStore, /transports: \['polling', 'websocket'\]/u);
assert.match(chatStore, /connect_error/u);
assert.match(chatScreen, /Promise\.allSettled/u);
assert.match(chatScreen, /connect\(\);/u);
assert.match(chatInput, /asset\.mimeType/u);
assert.match(chatInput, /asset\.fileName/u);

assert.match(themeEditor, /onCompleteJS=\{onColorSelect\}/u);
assert.doesNotMatch(themeEditor, /onComplete=\{onColorSelect\}/u);

assert.match(blogStore, /replacePost/u);
assert.match(blogStore, /fetchPosts\(\)\.catch/u);
assert.match(announcementStore, /replaceAnnouncement/u);
assert.match(announcementStore, /fetchPublicAnnouncements\(\)\.catch/u);

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
