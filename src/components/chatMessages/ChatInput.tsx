// src/components/chatMessages/ChatInput.tsx

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import type { ChatAttachment } from '../../services/chat';
import { useChatStore } from '../../store/useChatStore';
import { getPreviewFromRichText } from '../../utils/textUtils';

interface Props {
    readonly onSend: (text: string, attachment?: ChatAttachment) => Promise<void>;
    readonly onTyping?: () => void;
    readonly onFocus?: () => void;
}

interface SelectedMedia extends ChatAttachment {
    readonly type: 'image' | 'video' | 'file';
}

const imageFallback = {
    filename: 'chat-image.jpg',
    mimeType: 'image/jpeg'
} as const;

const videoFallback = {
    filename: 'chat-video.mp4',
    mimeType: 'video/mp4'
} as const;

export const ChatInput = ({ onSend, onTyping, onFocus }: Props) => {
    const [message, setMessage] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sending, setSending] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const replyingTo = useChatStore((state) => state.replyingTo);
    const setReplyingTo = useChatStore((state) => state.setReplyingTo);
    const colors = useTheme().currentTheme;

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        return () => {
            recording?.stopAndUnloadAsync().catch(() => undefined);
        };
    }, [recording]);

    const startRecording = async (): Promise<void> => {
        try {
            const permission = await Audio.requestPermissionsAsync();

            if (permission.status !== 'granted') {
                Alert.alert(
                    'Permiso requerido',
                    'Activa el permiso del micrófono para grabar notas de voz.'
                );
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });
            const created = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(created.recording);
            setIsRecording(true);
        } catch {
            Alert.alert('Error', 'No fue posible iniciar la grabación.');
        }
    };

    const stopRecording = async (): Promise<void> => {
        setIsRecording(false);

        if (!recording) {
            return;
        }

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (!uri) {
                throw new Error('Audio URI unavailable');
            }

            setSending(true);
            await onSend('', {
                uri,
                type: 'audio',
                filename: 'chat-audio.m4a',
                mimeType: 'audio/mp4'
            });
        } catch {
            Alert.alert('Error', 'No fue posible enviar la nota de voz.');
        } finally {
            setSending(false);
        }
    };

    const pickMedia = async (): Promise<void> => {
        setShowAttachmentModal(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.7,
            videoMaxDuration: 60
        });

        if (result.canceled) {
            return;
        }

        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        const fallback = isVideo ? videoFallback : imageFallback;
        setSelectedMedia({
            uri: asset.uri,
            type: isVideo ? 'video' : 'image',
            filename: asset.fileName ?? fallback.filename,
            mimeType: asset.mimeType ?? fallback.mimeType
        });
    };

    const pickFile = async (): Promise<void> => {
        setShowAttachmentModal(false);
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ],
            copyToCacheDirectory: true,
            multiple: false
        });

        if (result.canceled) {
            return;
        }

        const asset = result.assets[0];
        setSelectedMedia({
            uri: asset.uri,
            type: 'file',
            filename: asset.name,
            mimeType: asset.mimeType ?? 'application/pdf'
        });
    };

    const onSubmit = async (): Promise<void> => {
        const textToSend = message.trim();

        if (sending || (textToSend.length === 0 && !selectedMedia)) {
            return;
        }

        const mediaToSend = selectedMedia;
        const replyToRestore = replyingTo;

        setSending(true);
        setMessage('');
        setSelectedMedia(null);
        setReplyingTo(null);

        try {
            await onSend(textToSend, mediaToSend ?? undefined);
        } catch {
            setMessage((current) => current.length === 0 ? textToSend : current);
            setSelectedMedia((current) => current ?? mediaToSend);
            setReplyingTo(replyToRestore);
            Alert.alert('Error', 'No fue posible enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const handleTextChange = (text: string): void => {
        setMessage(text);
        onTyping?.();
    };

    const getPreviewIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (selectedMedia?.type) {
            case 'video': return 'videocam';
            case 'image': return 'image';
            case 'file': return 'document-attach';
            default: return 'attach';
        }
    };

    const getReplyingPreview = (): string => {
        if (!replyingTo) {
            return '';
        }

        return typeof replyingTo.content === 'string'
            ? replyingTo.content
            : getPreviewFromRichText(replyingTo.content);
    };

    return (
        <View>
            <Modal
                visible={showAttachmentModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAttachmentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>Adjuntar contenido</Text>

                        <TouchableOpacity style={styles.modalOption} onPress={() => void pickMedia()}>
                            <Ionicons name="images-outline" size={24} color={colors.primaryColor} />
                            <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Imagen o video</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={() => void pickFile()}>
                            <Ionicons name="document-attach-outline" size={24} color={colors.primaryColor} />
                            <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Documento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCancel, { borderColor: colors.borderColor }]}
                            onPress={() => setShowAttachmentModal(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.secondaryTextColor }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {replyingTo && (
                <View style={[styles.replyBar, { backgroundColor: colors.cardColor, borderTopColor: colors.borderColor }]}>
                    <View style={[styles.replyBarLine, { backgroundColor: colors.primaryColor }]} />
                    <View style={styles.flexOne}>
                        <Text style={[styles.replyBarName, { color: colors.primaryColor }]}>
                            Respondiendo a {replyingTo.author.name.split(' ')[0] || 'Usuario'}
                        </Text>
                        <Text numberOfLines={2} style={[styles.replyBarText, { color: colors.secondaryTextColor }]}>
                            {getReplyingPreview()}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <Ionicons name="close-circle" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                </View>
            )}

            {selectedMedia && (
                <View style={[styles.imagePreviewBar, { backgroundColor: colors.cardColor, borderTopColor: colors.borderColor }]}>
                    <View style={styles.previewRow}>
                        <Ionicons
                            name={getPreviewIcon()}
                            size={24}
                            color={colors.textColor}
                            style={styles.previewIcon}
                        />
                        <Text style={[styles.previewText, { color: colors.textColor }]} numberOfLines={1}>
                            {selectedMedia.filename}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeImageBtn}>
                        <Ionicons name="close-circle" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.container, { backgroundColor: colors.primaryColor }]}>
                <View style={styles.itemInput}>
                    {!isRecording && (
                        <TouchableOpacity
                            onPress={() => setShowAttachmentModal(true)}
                            style={styles.attachBtn}
                            disabled={sending}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle-outline" size={32} color={colors.buttonTextColor} />
                        </TouchableOpacity>
                    )}

                    {isRecording ? (
                        <View style={[styles.recordingContainer, { backgroundColor: colors.cardColor }]}>
                            <Text style={styles.recordingText}>Grabando audio...</Text>
                        </View>
                    ) : (
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.isDark
                                        ? 'rgba(0,0,0,0.3)'
                                        : 'rgba(255,255,255,0.2)',
                                    color: colors.buttonTextColor
                                }
                            ]}
                            placeholder="Mensaje..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            multiline
                            textAlignVertical="top"
                            value={message}
                            onChangeText={handleTextChange}
                            onFocus={onFocus}
                            autoCorrect
                            spellCheck
                            autoCapitalize="sentences"
                            keyboardType="default"
                            keyboardAppearance={colors.isDark ? 'dark' : 'light'}
                            editable={!sending}
                            blurOnSubmit={false}
                            scrollEnabled
                        />
                    )}

                    {keyboardVisible && !isRecording && (
                        <TouchableOpacity
                            style={styles.keyboardButton}
                            onPress={Keyboard.dismiss}
                            disabled={sending}
                            activeOpacity={0.7}
                            accessibilityLabel="Ocultar teclado"
                        >
                            <Ionicons
                                name="chevron-down-circle-outline"
                                color={colors.buttonTextColor}
                                size={25}
                            />
                        </TouchableOpacity>
                    )}

                    {message.trim().length > 0 || selectedMedia ? (
                        <TouchableOpacity
                            style={styles.iconSend}
                            onPress={() => void onSubmit()}
                            disabled={sending}
                            activeOpacity={0.7}
                            accessibilityLabel="Enviar mensaje"
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.buttonTextColor} />
                            ) : (
                                <Ionicons name="send" color={colors.buttonTextColor} size={24} />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.iconSend}
                            onPressIn={() => void startRecording()}
                            onPressOut={() => void stopRecording()}
                            disabled={sending}
                            activeOpacity={0.7}
                            accessibilityLabel="Grabar nota de voz"
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.buttonTextColor} />
                            ) : (
                                <Ionicons
                                    name={isRecording ? 'mic' : 'mic-outline'}
                                    color={isRecording ? '#ff3b30' : colors.buttonTextColor}
                                    size={24}
                                />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: {
        width: '100%',
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        paddingHorizontal: 10,
        paddingTop: 8
    },
    itemInput: { flexDirection: 'row', alignItems: 'flex-end' },
    input: {
        flex: 1,
        fontSize: 16,
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        maxHeight: 100,
        marginLeft: 5,
        minHeight: 40
    },
    attachBtn: { marginVertical: 'auto', paddingHorizontal: 3 },
    keyboardButton: { marginLeft: 6, marginVertical: 'auto', padding: 4 },
    iconSend: {
        minWidth: 38,
        minHeight: 38,
        marginLeft: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recordingContainer: {
        flex: 1,
        height: 40,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5
    },
    recordingText: { color: '#ff3b30', fontWeight: 'bold' },
    replyBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
    replyBarLine: { width: 4, height: '100%', marginRight: 10, borderRadius: 2 },
    replyBarName: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    replyBarText: { fontSize: 12 },
    imagePreviewBar: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1
    },
    previewRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    previewIcon: { marginRight: 10 },
    previewText: { maxWidth: 240 },
    removeImageBtn: { marginLeft: 10 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    modalOption: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center' },
    modalOptionText: { marginLeft: 15, fontSize: 16 },
    modalCancel: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, marginTop: 10 },
    modalCancelText: { fontWeight: '600' }
});
