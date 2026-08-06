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
    'src/hooks/query/useNotificationsData.ts',
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
    'src/components/chatMessages/ChatInput.tsx',
    'src/constants/chatStickers.ts',
    'src/components/chatMessages/ChatMessageItem.tsx',
    'src/components/chatMessages/MessageDetailsModal.tsx',
    'src/components/chatMessages/MessageContent.tsx',
    'src/components/shared/MediaViewerModal.tsx',
    'src/components/home/HomeQuickMenuModal.tsx',
    'src/navigation/AppNavigator.tsx',
    'src/navigation/TabsNavigator.tsx',
    'src/screens/chat/ChatScreen.tsx',
    'src/screens/gallery/GalleryScreen.tsx',
    'src/screens/gallery/MediaDetailScreen.tsx',
    'src/utils/mediaUtils.ts',
    'src/screens/settings/AdminSettingsScreen.tsx',
    'src/screens/settings/profile/ProfileScreen.tsx',
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
    'src/store/useThemeStore.ts',
    'src/types/chat.ts',
    'src/types/notification.ts',
    'src/types/settings.ts',
    'src/types/tiptap.ts',
    'src/utils/normalizeChatMessage.ts',
    'src/utils/tiptapUtils.ts'
];

for (const relativePath of changedSources) {
    const source = read(relativePath);
    assert.match(source, /^\/\//u, `${relativePath} must start with its file path comment`);
    assert.doesNotMatch(source, /\bas any\b/u, `${relativePath} must not use as any`);
    assert.doesNotMatch(source, /:\s*any\b/u, `${relativePath} must not use any`);
    assert.doesNotMatch(source, /<any>/u, `${relativePath} must not use any generics`);
    assert.doesNotMatch(source, /@ts-ignore/u, `${relativePath} must not suppress TypeScript errors`);
    assert.doesNotMatch(source, /\bunknown\b/u, `${relativePath} must not use unknown`);
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
const chatMessageItem = read('src/components/chatMessages/ChatMessageItem.tsx');
const messageContent = read('src/components/chatMessages/MessageContent.tsx');
const mediaViewerModal = read('src/components/shared/MediaViewerModal.tsx');
const appNavigator = read('src/navigation/AppNavigator.tsx');
const tabsNavigator = read('src/navigation/TabsNavigator.tsx');
const chatTypes = read('src/types/chat.ts');

const notificationTypes = read('src/types/notification.ts');
const notificationService = read('src/services/notifications.ts');
const notificationData = read('src/hooks/query/useNotificationsData.ts');
const messageDetailsModal = read('src/components/chatMessages/MessageDetailsModal.tsx');
const homeQuickMenu = read('src/components/home/HomeQuickMenuModal.tsx');
const homeScreen = read('src/screens/HomeScreen.tsx');
const normalizeChatMessage = read('src/utils/normalizeChatMessage.ts');
const chatStickers = read('src/constants/chatStickers.ts');
const mediaDetail = read('src/screens/gallery/MediaDetailScreen.tsx');
const mediaUtils = read('src/utils/mediaUtils.ts');
const testflightEnv = read('.env.testflight.example');
const authService = read('src/services/auth.ts');
const songTypesScreen = read('src/screens/songs/SongTypesScreen.tsx');
const galleryScreen = read('src/screens/gallery/GalleryScreen.tsx');
const songService = read('src/services/song.ts');
const platformProfile = read('src/screens/platform/PlatformProfileScreen.tsx');
const pushDevices = read('src/services/pushDevices.ts');
const deviceIdentity = read('src/services/deviceIdentity.ts');
const multipart = read('src/services/multipart.ts');
const chatService = read('src/services/chat.ts');

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
assert.doesNotMatch(chatScreen, /KeyboardAvoidingView/u);
assert.match(chatScreen, /measureInWindow/u);
assert.match(chatScreen, /keyboardVisibleRef/u);
assert.match(chatScreen, /resetComposerShift/u);
assert.match(chatScreen, /keyboardWillHide/u);
assert.match(chatScreen, /keyboardDidHide/u);
assert.match(chatScreen, /event\.endCoordinates\.height <= 0/u);
assert.match(chatScreen, /translateY: -composerShift/u);
assert.doesNotMatch(chatScreen, /composerHeight \+ composerShift/u);
assert.match(chatScreen, /scrollToIndex/u);
assert.match(chatScreen, /onReplyPress=\{scrollToReply\}/u);
assert.match(chatScreen, /onContentSizeChange=\{pinChatToLatest\}/u);
assert.match(chatScreen, /onScrollBeginDrag=\{handleListScrollBeginDrag\}/u);
assert.match(chatScreen, /initialScrollPendingRef/u);
assert.match(chatScreen, /initialScrollSettleTimeoutRef/u);
assert.match(chatScreen, /useIsFocused/u);
assert.match(chatScreen, /composerDock/u);
assert.match(chatInput, /Keyboard\.dismiss/u);
assert.match(chatInput, /pendingPickerAction/u);
assert.match(chatInput, /prepareToRecordAsync/u);
assert.match(chatInput, /pauseRecording/u);
assert.match(chatInput, /resumeRecording/u);
assert.match(chatInput, /sendRecording/u);
assert.match(chatInput, /cancelRecording/u);
assert.match(chatInput, /pickCameraImage/u);
assert.match(chatInput, /showStickerModal/u);
assert.match(chatInput, /messageType\?: MessageType/u);
assert.match(chatInput, /replyToId\?: string/u);
assert.match(chatInput, /CHAT_STICKER_PACKS/u);
assert.match(chatInput, /ActivityIndicator/u);
assert.match(chatInput, /previewThumbnail/u);
assert.match(chatInput, /Imagen lista para enviar/u);
assert.doesNotMatch(chatInput, /Ocultar teclado/u);
assert.match(chatMessageItem, /checkmark-done/u);
assert.match(chatMessageItem, /message\.readBy/u);
assert.match(chatMessageItem, /onReplyPress/u);
assert.match(chatMessageItem, /Ir al mensaje original/u);
assert.match(messageContent, /type === 'STICKER'/u);
assert.match(messageContent, /audioWaveform/u);
assert.match(chatTypes, /'STICKER'/u);
assert.match(chatTypes, /deliveredTo/u);
assert.match(chatTypes, /readBy/u);
assert.match(normalizeChatMessage, /normalizeReceiptIds/u);
assert.match(normalizeChatMessage, /authorName/u);
assert.match(chatData, /replyToId/u);
assert.doesNotMatch(chatData, /const replyingTo = useChatStore/u);
assert.match(chatStickers, /CHAT_STICKER_PACKS/u);
assert.match(mediaDetail, /switchControlContainer/u);
assert.match(mediaDetail, /useSafeAreaInsets/u);
assert.match(mediaDetail, /PanResponder\.create/u);
assert.match(mediaDetail, /transitionToMedia/u);
assert.match(mediaDetail, /hasPrevious/u);
assert.match(mediaDetail, /hasNext/u);
assert.match(mediaDetail, /dismissViewer/u);
assert.match(mediaDetail, /key=\{`preview-\$\{media\.id\}`\}/u);
assert.match(mediaDetail, /key=\{`full-\$\{media\.id\}`\}/u);
assert.match(mediaDetail, /Image\.prefetch/u);
assert.match(mediaDetail, /getGalleryPreviewUri/u);
assert.match(mediaDetail, /imageOpacity/u);
assert.match(galleryScreen, /previewUri/u);
assert.match(galleryScreen, /Image\.prefetch/u);
assert.match(mediaUtils, /c_fill,w_720,h_720,q_auto,f_auto/u);
assert.match(mediaUtils, /getGalleryPreviewUri/u);
assert.match(mediaViewerModal, /PanResponder\.create/u);
assert.match(mediaViewerModal, /dismissViewer/u);
assert.match(mediaViewerModal, /translateY/u);
assert.match(appNavigator, /screen: 'HomeTab'/u);
assert.match(appNavigator, /params: \{ screen: 'HomeScreen' \}/u);
assert.match(tabsNavigator, /NavigatorScreenParams<HomeStackParamList>/u);
assert.match(testflightEnv, /https:\/\/choirs-api-production\.up\.railway\.app/u);
assert.doesNotMatch(testflightEnv, /https:\/\/https:\/\//u);
assert.doesNotMatch(testflightEnv, /chiors/u);

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
assert.match(chatService, /CHAT_UPLOAD_TIMEOUT_MS = 90_000/u);
assert.match(chatService, /markChatReceipts/u);
assert.match(chatData, /useMarkChatReceiptsMutation/u);
assert.match(chatStore, /markChatReceipts/u);

assert.match(chatTypes, /recipientUserIds/u);
assert.match(chatTypes, /deliveryReceipts/u);
assert.match(chatTypes, /readReceipts/u);
assert.match(chatTypes, /ChatMessageDetails/u);
assert.match(chatMessageItem, /allDelivered/u);
assert.match(chatMessageItem, /allRead/u);
assert.match(chatMessageItem, /Detalles/u);
assert.match(chatMessageItem, /MessageDetailsModal/u);
assert.match(messageDetailsModal, /Leído por/u);
assert.match(messageDetailsModal, /Entregado a/u);
assert.match(messageDetailsModal, /TouchableWithoutFeedback/u);
assert.match(notificationTypes, /CHAT_REACTION/u);
assert.match(notificationTypes, /BLOG_COMMENT/u);
assert.match(notificationService, /\/notifications\/read-all/u);
assert.match(notificationData, /useNotificationsQuery/u);
assert.match(homeQuickMenu, /Accesos rápidos/u);
assert.match(homeQuickMenu, /Apariencia y temas/u);
assert.match(homeQuickMenu, /Notificaciones/u);
assert.match(tabsNavigator, /tabBarBadge/u);
assert.match(homeScreen, /HomeQuickMenuModal/u);
assert.match(homeScreen, /notificationBadge/u);
assert.match(chatScreen, /useMarkNotificationsReadMutation/u);
assert.match(chatScreen, /status: 'READ'/u);
assert.match(tabsNavigator, /status: 'DELIVERED'/u);
assert.match(tabsNavigator, /CHAT_MESSAGE/u);
assert.match(homeScreen, /focusMessageId: resourceId/u);
assert.match(chatScreen, /route\.params\?\.focusMessageId/u);
assert.match(chatScreen, /navigation\.setParams\(\{ focusMessageId: undefined \}\)/u);
assert.match(chatMessageItem, /\.\.\.\(isMe/u);
assert.match(songService, /normalizeSong/u);
assert.match(songService, /resolveRawSongTypeId/u);

console.log('Production and performance regression contract tests passed.');
