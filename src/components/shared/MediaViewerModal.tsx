// src/components/shared/MediaViewerModal.tsx

import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useMediaResource } from '../../hooks/useMediaResource';
import type { MediaCacheCategory } from '../../types/sync';
import { MediaActionsModal } from './MediaActionsModal';

interface MediaViewerModalProps {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly mediaUrl: string | null;
    readonly mediaType: 'image' | 'video';
    readonly filename?: string;
    readonly mimeType?: string;
    readonly category?: MediaCacheCategory;
    readonly initialBytes?: number;
    readonly actionsEnabled?: boolean;
}

export const MediaViewerModal = ({
    visible,
    onClose,
    mediaUrl,
    mediaType,
    filename,
    mimeType,
    category = 'chat',
    initialBytes = 0,
    actionsEnabled = true
}: MediaViewerModalProps) => {
    const [scale, setScale] = useState(1);
    const [actionsVisible, setActionsVisible] = useState(false);
    const lastTap = useRef<number | null>(null);
    const resource = useMediaResource({
        remoteUrl: mediaUrl ?? '',
        filename,
        mimeType,
        kind: mediaType === 'video' ? 'VIDEO' : 'IMAGE',
        category
    });

    if (!mediaUrl) {
        return null;
    }

    const handleDoubleTap = (): void => {
        const now = Date.now();

        if (lastTap.current && now - lastTap.current < 300) {
            setScale((current) => current > 1 ? 1 : 2);
            return;
        }

        lastTap.current = now;
    };

    const handleClose = (): void => {
        setActionsVisible(false);
        setScale(1);
        onClose();
    };

    const handleOpenActions = (): void => {
        setScale(1);
        onClose();

        setTimeout(() => {
            setActionsVisible(true);
        }, Platform.OS === 'ios' ? 280 : 80);
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.container}>
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.iconButton}
                            accessibilityLabel="Cerrar visor"
                        >
                            <Ionicons name="close" size={28} color="#ffffff" />
                        </TouchableOpacity>

                        {actionsEnabled && (
                            <TouchableOpacity
                                onPress={handleOpenActions}
                                style={styles.iconButton}
                                accessibilityLabel="Abrir acciones del archivo"
                            >
                                <Ionicons
                                    name="ellipsis-horizontal"
                                    size={26}
                                    color="#ffffff"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.content}>
                        {resource.state === 'DOWNLOADING' && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#ffffff" />
                            </View>
                        )}

                        {mediaType === 'video' ? (
                            <Video
                                style={styles.media}
                                source={{ uri: resource.displayUri }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                                shouldPlay={visible}
                            />
                        ) : (
                            <ScrollView
                                contentContainerStyle={styles.imageScrollContent}
                                maximumZoomScale={3}
                                minimumZoomScale={1}
                                centerContent
                                scrollEnabled={scale > 1}
                            >
                                <TouchableWithoutFeedback onPress={handleDoubleTap}>
                                    <Image
                                        source={{ uri: resource.displayUri }}
                                        style={[
                                            styles.media,
                                            Platform.OS === 'web'
                                                ? {
                                                    width: `${scale * 100}%`,
                                                    height: `${scale * 100}%`
                                                }
                                                : undefined
                                        ]}
                                        resizeMode="contain"
                                    />
                                </TouchableWithoutFeedback>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {actionsEnabled && (
                <MediaActionsModal
                    visible={actionsVisible}
                    onClose={() => setActionsVisible(false)}
                    remoteUrl={mediaUrl}
                    filename={filename}
                    mimeType={mimeType}
                    kind={mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                    category={category}
                    initialBytes={initialBytes}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000'
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        overflow: 'hidden'
    },
    imageScrollContent: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    media: {
        width: '100%',
        height: '100%'
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
        zIndex: 2
    }
});
