// src/components/chatMessages/ChatInput.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import type { MessageType } from '../../types/chat';
import { getPreviewFromRichText } from '../../utils/textUtils';

interface Props {
    readonly onSend: (
        text: string,
        attachment?: ChatAttachment,
        messageType?: MessageType
    ) => Promise<void>;
    readonly onTyping?: () => void;
    readonly onFocus?: () => void;
}

interface SelectedMedia extends ChatAttachment {
    readonly type: 'image' | 'video' | 'file';
}

interface StickerOption {
    readonly id: string;
    readonly value: string;
    readonly label: string;
}

type AttachmentPickerAction = 'media' | 'file';
type RecordingState = 'idle' | 'starting' | 'recording' | 'paused' | 'stopping';

const imageFallback = {
    filename: 'chat-image.jpg',
    mimeType: 'image/jpeg'
} as const;

const videoFallback = {
    filename: 'chat-video.mp4',
    mimeType: 'video/mp4'
} as const;

const stickerOptions: readonly StickerOption[] = [
    { id: 'smile', value: '😀', label: 'Sonrisa' },
    { id: 'laugh', value: '😂', label: 'Risa' },
    { id: 'love', value: '😍', label: 'Me encanta' },
    { id: 'pray', value: '🙏', label: 'Oración' },
    { id: 'music', value: '🎶', label: 'Música' },
    { id: 'microphone', value: '🎤', label: 'Micrófono' },
    { id: 'notes', value: '🎵', label: 'Notas' },
    { id: 'heart', value: '❤️', label: 'Corazón' },
    { id: 'clap', value: '👏', label: 'Aplausos' },
    { id: 'party', value: '🎉', label: 'Celebración' },
    { id: 'cross', value: '✝️', label: 'Cruz' },
    { id: 'coffee', value: '☕', label: 'Café' },
    { id: 'angel', value: '😇', label: 'Ángel' },
    { id: 'peace', value: '🕊️', label: 'Paz' },
    { id: 'sparkles', value: '✨', label: 'Destellos' },
    { id: 'choir', value: '👥', label: 'Coro' }
];

const pickerPresentationDelayMs = Platform.OS === 'ios' ? 300 : 80;
const recordingProgressIntervalMs = 200;

const formatDuration = (durationMillis: number): string => {
    const totalSeconds = Math.max(0, Math.floor(durationMillis / 1_000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ChatInput = ({ onSend, onTyping, onFocus }: Props) => {
    const recordingRef = useRef<Audio.Recording | null>(null);
    const [message, setMessage] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordingDurationMillis, setRecordingDurationMillis] = useState(0);
    const [sending, setSending] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [showStickerModal, setShowStickerModal] = useState(false);
    const [pendingPickerAction, setPendingPickerAction] = useState<AttachmentPickerAction | null>(null);
    const replyingTo = useChatStore((state) => state.replyingTo);
    const setReplyingTo = useChatStore((state) => state.setReplyingTo);
    const colors = useTheme().currentTheme;
    const recordingActive = recordingState === 'recording' || recordingState === 'paused';
    const recordingBusy = recordingState === 'starting' || recordingState === 'stopping';
    const recordingPaused = recordingState === 'paused';

    const waveformHeights = useMemo(
        () => Array.from({ length: 28 }, (_value, index) => {
            const phase = Math.floor(recordingDurationMillis / recordingProgressIntervalMs) + index;
            return 7 + ((phase * 7 + index * 3) % 20);
        }),
        [recordingDurationMillis]
    );

    useEffect(() => {
        return () => {
            const activeRecording = recordingRef.current;
            recordingRef.current = null;

            if (activeRecording) {
                void activeRecording.stopAndUnloadAsync().catch(() => undefined);
            }

            void Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false
            }).catch(() => undefined);
        };
    }, []);

    useEffect(() => {
        if (showAttachmentModal || !pendingPickerAction) {
            return undefined;
        }

        const action = pendingPickerAction;
        const timeout = setTimeout(() => {
            setPendingPickerAction(null);

            if (action === 'media') {
                void pickMedia();
            } else {
                void pickFile();
            }
        }, pickerPresentationDelayMs);

        return () => clearTimeout(timeout);
    }, [pendingPickerAction, showAttachmentModal]);

    const resetAudioMode = async (): Promise<void> => {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false
        });
    };

    const resetRecordingState = (): void => {
        recordingRef.current = null;
        setRecordingDurationMillis(0);
        setRecordingState('idle');
    };

    const startRecording = async (): Promise<void> => {
        if (recordingState !== 'idle' || sending) {
            return;
        }

        setRecordingState('starting');
        setRecordingDurationMillis(0);
        Keyboard.dismiss();

        try {
            const permission = await Audio.requestPermissionsAsync();

            if (permission.status !== 'granted') {
                setRecordingState('idle');
                Alert.alert(
                    'Permiso requerido',
                    'Activa el permiso del micrófono para grabar notas de voz.'
                );
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false
            });

            const nextRecording = new Audio.Recording();
            nextRecording.setProgressUpdateInterval(recordingProgressIntervalMs);
            nextRecording.setOnRecordingStatusUpdate((status) => {
                if (status.canRecord) {
                    setRecordingDurationMillis(status.durationMillis);
                }
            });
            await nextRecording.prepareToRecordAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            await nextRecording.startAsync();
            recordingRef.current = nextRecording;
            setRecordingState('recording');
        } catch (error) {
            resetRecordingState();
            await resetAudioMode().catch(() => undefined);
            console.error('Chat audio recording start failed', error);
            Alert.alert('Error', 'No fue posible iniciar la grabación. Intenta nuevamente.');
        }
    };

    const pauseRecording = async (): Promise<void> => {
        const activeRecording = recordingRef.current;

        if (recordingState !== 'recording' || !activeRecording) {
            return;
        }

        try {
            await activeRecording.pauseAsync();
            setRecordingState('paused');
        } catch (error) {
            console.error('Chat audio recording pause failed', error);
            Alert.alert('Error', 'No fue posible pausar la grabación.');
        }
    };

    const resumeRecording = async (): Promise<void> => {
        const activeRecording = recordingRef.current;

        if (recordingState !== 'paused' || !activeRecording) {
            return;
        }

        try {
            await activeRecording.startAsync();
            setRecordingState('recording');
        } catch (error) {
            console.error('Chat audio recording resume failed', error);
            Alert.alert('Error', 'No fue posible continuar la grabación.');
        }
    };

    const cancelRecording = async (): Promise<void> => {
        const activeRecording = recordingRef.current;

        if (!recordingActive || !activeRecording) {
            return;
        }

        recordingRef.current = null;
        setRecordingState('stopping');

        try {
            await activeRecording.stopAndUnloadAsync();
        } catch (error) {
            console.warn('Chat audio recording discard failed', error);
        } finally {
            resetRecordingState();
            await resetAudioMode().catch(() => undefined);
        }
    };

    const sendRecording = async (): Promise<void> => {
        const activeRecording = recordingRef.current;

        if (!recordingActive || !activeRecording || sending) {
            return;
        }

        recordingRef.current = null;
        setRecordingState('stopping');

        try {
            await activeRecording.stopAndUnloadAsync();
            const uri = activeRecording.getURI();
            await resetAudioMode();

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
        } catch (error) {
            console.error('Chat audio recording send failed', error);
            Alert.alert('Error', 'No fue posible enviar la nota de voz.');
        } finally {
            setSending(false);
            resetRecordingState();
            await resetAudioMode().catch(() => undefined);
        }
    };

    async function pickMedia(): Promise<void> {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.7,
                videoMaxDuration: 60,
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN
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
        } catch (error) {
            console.error('Chat media picker failed', error);
            Alert.alert('Error', 'No fue posible abrir la galería del dispositivo.');
        }
    }

    const pickCameraImage = async (): Promise<void> => {
        if (sending || recordingState !== 'idle') {
            return;
        }

        Keyboard.dismiss();

        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();

            if (permission.status !== 'granted') {
                Alert.alert(
                    'Permiso requerido',
                    'Activa el permiso de la cámara para tomar una foto.'
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];
            setSelectedMedia({
                uri: asset.uri,
                type: 'image',
                filename: asset.fileName ?? imageFallback.filename,
                mimeType: asset.mimeType ?? imageFallback.mimeType
            });
        } catch (error) {
            console.error('Chat camera capture failed', error);
            Alert.alert('Error', 'No fue posible abrir la cámara.');
        }
    };

    async function pickFile(): Promise<void> {
        try {
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
                mimeType: asset.mimeType ?? 'application/octet-stream'
            });
        } catch (error) {
            console.error('Chat document picker failed', error);
            Alert.alert('Error', 'No fue posible abrir el selector de archivos.');
        }
    }

    const requestAttachmentPicker = (action: AttachmentPickerAction): void => {
        if (sending || recordingState !== 'idle') {
            return;
        }

        setPendingPickerAction(action);
        setShowAttachmentModal(false);
    };

    const closeAttachmentModal = (): void => {
        setPendingPickerAction(null);
        setShowAttachmentModal(false);
    };

    const onSubmit = async (): Promise<void> => {
        const textToSend = message.trim();

        if (sending || recordingState !== 'idle' || (textToSend.length === 0 && !selectedMedia)) {
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

    const sendSticker = async (sticker: StickerOption): Promise<void> => {
        if (sending || recordingState !== 'idle') {
            return;
        }

        setShowStickerModal(false);
        setSending(true);

        try {
            await onSend(sticker.value, undefined, 'STICKER');
        } catch {
            Alert.alert('Error', 'No fue posible enviar el sticker.');
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
                onRequestClose={closeAttachmentModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closeAttachmentModal}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalContent, { backgroundColor: colors.cardColor }]}
                    >
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>Adjuntar contenido</Text>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => requestAttachmentPicker('media')}
                        >
                            <Ionicons name="images-outline" size={24} color={colors.primaryColor} />
                            <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Imagen o video</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => requestAttachmentPicker('file')}
                        >
                            <Ionicons name="document-attach-outline" size={24} color={colors.primaryColor} />
                            <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Documento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalCancel, { borderColor: colors.borderColor }]}
                            onPress={closeAttachmentModal}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.secondaryTextColor }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showStickerModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStickerModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStickerModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.stickerModalContent, { backgroundColor: colors.cardColor }]}
                    >
                        <View style={styles.stickerHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>Stickers</Text>
                            <TouchableOpacity onPress={() => setShowStickerModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.stickerGrid}>
                            {stickerOptions.map((sticker) => (
                                <TouchableOpacity
                                    key={sticker.id}
                                    style={[styles.stickerButton, { backgroundColor: colors.backgroundColor }]}
                                    onPress={() => void sendSticker(sticker)}
                                    accessibilityLabel={`Enviar sticker ${sticker.label}`}
                                >
                                    <Text style={styles.stickerText}>{sticker.value}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
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
                        {selectedMedia.type === 'image' ? (
                            <Image
                                source={{ uri: selectedMedia.uri }}
                                style={styles.previewThumbnail}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.previewFallback, { backgroundColor: colors.backgroundColor }]}> 
                                <Ionicons
                                    name={getPreviewIcon()}
                                    size={24}
                                    color={colors.textColor}
                                />
                            </View>
                        )}
                        <View style={styles.previewTextContainer}>
                            <Text style={[styles.previewText, { color: colors.textColor }]} numberOfLines={1}>
                                {selectedMedia.filename}
                            </Text>
                            <Text style={[styles.previewType, { color: colors.secondaryTextColor }]}> 
                                {selectedMedia.type === 'image'
                                    ? 'Imagen lista para enviar'
                                    : selectedMedia.type === 'video'
                                        ? 'Video listo para enviar'
                                        : 'Documento listo para enviar'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeImageBtn}>
                        <Ionicons name="close-circle" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.container, { backgroundColor: colors.primaryColor }]}> 
                {recordingActive || recordingBusy ? (
                    <View style={styles.recordingToolbar}>
                        <TouchableOpacity
                            style={styles.recordingAction}
                            onPress={() => void cancelRecording()}
                            disabled={recordingBusy || sending}
                            accessibilityLabel="Eliminar nota de voz"
                        >
                            <Ionicons name="trash-outline" size={26} color="#ff3b30" />
                        </TouchableOpacity>

                        <View style={[styles.recordingTrack, { backgroundColor: colors.cardColor }]}> 
                            <Text style={[styles.recordingDuration, { color: colors.textColor }]}> 
                                {formatDuration(recordingDurationMillis)}
                            </Text>
                            <View style={styles.waveform}>
                                {waveformHeights.map((height, index) => (
                                    <View
                                        key={`${index}-${height}`}
                                        style={[
                                            styles.waveformBar,
                                            {
                                                height,
                                                backgroundColor: recordingPaused
                                                    ? colors.secondaryTextColor
                                                    : colors.primaryColor
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.recordingAction}
                            onPress={() => void (recordingPaused ? resumeRecording() : pauseRecording())}
                            disabled={recordingBusy || sending}
                            accessibilityLabel={recordingPaused ? 'Continuar grabación' : 'Pausar grabación'}
                        >
                            {recordingBusy ? (
                                <ActivityIndicator size="small" color={colors.buttonTextColor} />
                            ) : (
                                <Ionicons
                                    name={recordingPaused ? 'play' : 'pause'}
                                    size={24}
                                    color={colors.buttonTextColor}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.recordingSend, { backgroundColor: colors.buttonTextColor }]}
                            onPress={() => void sendRecording()}
                            disabled={recordingBusy || sending}
                            accessibilityLabel="Enviar nota de voz"
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.primaryColor} />
                            ) : (
                                <Ionicons name="send" size={23} color={colors.primaryColor} />
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.itemInput}>
                        <TouchableOpacity
                            onPress={() => setShowAttachmentModal(true)}
                            style={styles.attachBtn}
                            disabled={sending}
                            activeOpacity={0.7}
                            accessibilityLabel="Adjuntar contenido"
                        >
                            <Ionicons name="add-circle-outline" size={32} color={colors.buttonTextColor} />
                        </TouchableOpacity>

                        <View
                            style={[
                                styles.inputShell,
                                {
                                    backgroundColor: colors.isDark
                                        ? 'rgba(0,0,0,0.3)'
                                        : 'rgba(255,255,255,0.2)'
                                }
                            ]}
                        >
                            <TextInput
                                style={[styles.input, { color: colors.buttonTextColor }]}
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
                            <TouchableOpacity
                                style={styles.stickerIcon}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowStickerModal(true);
                                }}
                                disabled={sending}
                                accessibilityLabel="Abrir stickers"
                            >
                                <Ionicons name="happy-outline" size={24} color={colors.buttonTextColor} />
                            </TouchableOpacity>
                        </View>

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
                                    <Ionicons name="send" color={colors.buttonTextColor} size={25} />
                                )}
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.compactAction}
                                    onPress={() => void pickCameraImage()}
                                    disabled={sending}
                                    activeOpacity={0.7}
                                    accessibilityLabel="Tomar foto"
                                >
                                    <Ionicons name="camera-outline" color={colors.buttonTextColor} size={25} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.compactAction}
                                    onPress={() => void startRecording()}
                                    disabled={sending}
                                    activeOpacity={0.7}
                                    accessibilityLabel="Iniciar nota de voz"
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color={colors.buttonTextColor} />
                                    ) : (
                                        <Ionicons name="mic-outline" color={colors.buttonTextColor} size={26} />
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: {
        width: '100%',
        paddingBottom: 8,
        paddingHorizontal: 10,
        paddingTop: 8
    },
    itemInput: { flexDirection: 'row', alignItems: 'flex-end' },
    inputShell: {
        flex: 1,
        minHeight: 42,
        maxHeight: 112,
        marginLeft: 5,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 4,
        minHeight: 42,
        maxHeight: 112
    },
    stickerIcon: {
        width: 38,
        minHeight: 42,
        justifyContent: 'center',
        alignItems: 'center'
    },
    attachBtn: { marginVertical: 'auto', paddingHorizontal: 3 },
    iconSend: {
        minWidth: 42,
        minHeight: 42,
        marginLeft: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    compactAction: {
        width: 38,
        minHeight: 42,
        marginLeft: 3,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recordingToolbar: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center'
    },
    recordingAction: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recordingTrack: {
        flex: 1,
        minHeight: 44,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12
    },
    recordingDuration: { width: 42, fontSize: 13, fontWeight: '700' },
    waveform: {
        flex: 1,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden'
    },
    waveformBar: { width: 2, borderRadius: 1, opacity: 0.8 },
    recordingSend: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginLeft: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
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
    previewThumbnail: { width: 54, height: 54, borderRadius: 10, marginRight: 10 },
    previewFallback: {
        width: 54,
        height: 54,
        borderRadius: 10,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    previewTextContainer: { flex: 1 },
    previewText: { fontWeight: '600' },
    previewType: { fontSize: 12, marginTop: 3 },
    removeImageBtn: { marginLeft: 10 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, width: '100%' },
    stickerModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, width: '100%' },
    stickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    stickerButton: {
        width: '23%',
        aspectRatio: 1,
        margin: '1%',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    stickerText: { fontSize: 38 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    modalOption: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center' },
    modalOptionText: { marginLeft: 15, fontSize: 16 },
    modalCancel: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, marginTop: 10 },
    modalCancelText: { fontWeight: '600' }
});
