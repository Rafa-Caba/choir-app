import React, { useState, useEffect } from 'react';
import {
    StyleSheet, TextInput, View, TouchableOpacity, Platform, Text, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

import { useChatStore } from '../../store/useChatStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
    onSend: (text: string, attachment?: { uri: string, type: 'image' | 'video' | 'audio' | 'file' }) => void;
    onTyping?: () => void; // 🆕 Added
}

export const ChatInput = ({ onSend, onTyping }: Props) => {
    const [message, setMessage] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<{ uri: string, type: 'image' | 'video' | 'file' } | null>(null);

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);

    const { replyingTo, setReplyingTo } = useChatStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    useEffect(() => {
        return () => {
            if (recording) recording.stopAndUnloadAsync();
        };
    }, []);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
                setIsRecording(true);
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (uri) {
            onSend('', { uri, type: 'audio' });
        }
    };

    const pickMedia = async () => {
        setShowAttachmentModal(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.5,
            videoMaxDuration: 60,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setSelectedMedia({
                uri: asset.uri,
                type: asset.type === 'video' ? 'video' : 'image'
            });
        }
    };

    const pickFile = async () => {
        setShowAttachmentModal(false);
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true
        });

        if (!result.canceled) {
            setSelectedMedia({
                uri: result.assets[0].uri,
                type: 'file'
            });
        }
    };

    const onSubmit = () => {
        const textToSend = message.trim();

        if (textToSend.length > 0 || selectedMedia) {
            onSend(textToSend, selectedMedia || undefined);

            setMessage('');
            setSelectedMedia(null);
            if (replyingTo) setReplyingTo(null);
        }
    };

    const handleTextChange = (text: string) => {
        setMessage(text);
        if (onTyping) onTyping();
    };

    const getPreviewIcon = () => {
        if (!selectedMedia) return "help";
        switch (selectedMedia.type) {
            case 'video': return "videocam";
            case 'image': return "image";
            case 'file': return "document-attach";
            default: return "attach";
        }
    };

    const getReplyingPreview = () => {
        if (!replyingTo) return '';
        if (typeof replyingTo.content === 'string') {
            return replyingTo.content;
        }
        return getPreviewFromRichText(replyingTo.content);
    };

    const renderAttachmentModal = () => (
        <Modal visible={showAttachmentModal} transparent animationType="fade" onRequestClose={() => setShowAttachmentModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                    <Text style={[styles.modalTitle, { color: colors.textColor }]}>Adjuntar Contenido</Text>

                    <TouchableOpacity style={styles.modalOption} onPress={pickMedia}>
                        <Ionicons name="images-outline" size={24} color={colors.primaryColor} />
                        <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Imagen o Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalOption} onPress={pickFile}>
                        <Ionicons name="document-attach-outline" size={24} color={colors.primaryColor} />
                        <Text style={[styles.modalOptionText, { color: colors.textColor }]}>Archivo (PDF/DOC/ZIP)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.borderColor }]} onPress={() => setShowAttachmentModal(false)}>
                        <Text style={[styles.modalCancelText, { color: colors.secondaryTextColor }]}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View>
            {renderAttachmentModal()}

            {replyingTo && (
                <View style={[styles.replyBar, { backgroundColor: colors.cardColor, borderTopColor: colors.borderColor }]}>
                    <View style={[styles.replyBarLine, { backgroundColor: colors.primaryColor }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.replyBarName, { color: colors.primaryColor }]}>
                            Respondiendo a {replyingTo.author?.name?.split(' ')[0] || 'Usuario'}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                            name={getPreviewIcon()}
                            size={24}
                            color={colors.textColor}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={{ color: colors.textColor, maxWidth: 200 }} numberOfLines={1}>
                            {selectedMedia.type === 'video' ? 'Video seleccionado' : 'Archivo adjunto'}
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
                        <TouchableOpacity onPress={() => setShowAttachmentModal(true)} style={styles.attachBtn}>
                            <Ionicons name="add-circle-outline" size={32} color={colors.buttonTextColor} />
                        </TouchableOpacity>
                    )}

                    {isRecording ? (
                        <View style={[styles.recordingContainer, { backgroundColor: colors.cardColor }]}>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>Grabando audio...</Text>
                        </View>
                    ) : (
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
                                color: colors.buttonTextColor
                            }]}
                            placeholder="Mensaje..."
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            multiline
                            numberOfLines={1}
                            textAlignVertical="top"
                            value={message}
                            onChangeText={handleTextChange}
                        />
                    )}

                    {message.trim().length > 0 || selectedMedia ? (
                        <TouchableOpacity style={styles.iconSend} onPress={onSubmit}>
                            <Ionicons name="send" color={colors.buttonTextColor} size={24} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.iconSend}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                        >
                            <Ionicons
                                name={isRecording ? "mic" : "mic-outline"}
                                color={isRecording ? "red" : colors.buttonTextColor}
                                size={24}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', paddingBottom: Platform.OS === "ios" ? 20 : 10, paddingHorizontal: 10, paddingVertical: 10 },
    itemInput: { flexDirection: 'row', alignItems: 'flex-end' },
    input: {
        flex: 1, fontSize: 16,
        paddingTop: 10, paddingBottom: 10, paddingHorizontal: 15,
        borderRadius: 25, maxHeight: 100, marginLeft: 5, minHeight: 40
    },
    attachBtn: { marginVertical: 'auto', paddingHorizontal: 3 },
    iconSend: { marginLeft: 10, marginVertical: 'auto', padding: 5 },
    recordingContainer: { flex: 1, height: 40, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
    replyBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
    replyBarLine: { width: 4, height: '100%', marginRight: 10, borderRadius: 2 },
    replyBarName: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
    replyBarText: { fontSize: 12 },
    imagePreviewBar: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
    removeImageBtn: { marginLeft: 10 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    modalOption: { flexDirection: 'row', paddingVertical: 15, alignItems: 'center' },
    modalOptionText: { marginLeft: 15, fontSize: 16 },
    modalCancel: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, marginTop: 10 },
    modalCancelText: { fontWeight: '600' }
});