// src/components/shared/MediaViewerModal.tsx

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
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

const dismissDistance = 120;
const dismissVelocity = 1.05;

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
    const [gestureDismissed, setGestureDismissed] = useState(false);
    const lastTap = useRef<number | null>(null);
    const translateY = useRef(new Animated.Value(0)).current;
    const screenHeight = Dimensions.get('window').height;
    const resource = useMediaResource({
        remoteUrl: mediaUrl ?? '',
        filename,
        mimeType,
        kind: mediaType === 'video' ? 'VIDEO' : 'IMAGE',
        category
    });

    const viewerOpacity = useMemo(
        () => translateY.interpolate({
            inputRange: [0, screenHeight * 0.7],
            outputRange: [1, 0.35],
            extrapolate: 'clamp'
        }),
        [screenHeight, translateY]
    );

    const resetDismissPosition = useCallback((): void => {
        translateY.stopAnimation();
        translateY.setValue(0);
    }, [translateY]);

    const resetViewerState = useCallback((): void => {
        setScale(1);
        setGestureDismissed(false);
        resetDismissPosition();
    }, [resetDismissPosition]);

    useEffect(() => {
        if (visible) {
            resetViewerState();
        }
    }, [resetViewerState, visible]);

    const handleDoubleTap = (): void => {
        const now = Date.now();

        if (lastTap.current && now - lastTap.current < 300) {
            setScale((current) => current > 1 ? 1 : 2);
            return;
        }

        lastTap.current = now;
    };

    const handleClose = useCallback((): void => {
        setActionsVisible(false);
        onClose();
    }, [onClose]);

    const restoreViewerPosition = useCallback((): void => {
        Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 220,
            mass: 0.8,
            useNativeDriver: true
        }).start();
    }, [translateY]);

    const dismissViewer = useCallback((): void => {
        Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 190,
            useNativeDriver: true
        }).start(({ finished }) => {
            if (!finished) {
                return;
            }

            setGestureDismissed(true);
            requestAnimationFrame(() => {
                onClose();
            });
        });
    }, [onClose, screenHeight, translateY]);

    const dismissPanResponder = useMemo(
        () => PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gestureState) => {
                const verticalDistance = Math.abs(gestureState.dy);
                const horizontalDistance = Math.abs(gestureState.dx);

                return visible &&
                    scale <= 1 &&
                    gestureState.dy > 10 &&
                    verticalDistance > horizontalDistance * 1.2;
            },
            onPanResponderMove: (_event, gestureState) => {
                translateY.setValue(Math.max(0, gestureState.dy));
            },
            onPanResponderRelease: (_event, gestureState) => {
                if (
                    gestureState.dy >= dismissDistance ||
                    gestureState.vy >= dismissVelocity
                ) {
                    dismissViewer();
                    return;
                }

                restoreViewerPosition();
            },
            onPanResponderTerminate: restoreViewerPosition
        }),
        [dismissViewer, restoreViewerPosition, scale, translateY, visible]
    );

    const handleOpenActions = (): void => {
        setScale(1);
        onClose();

        setTimeout(() => {
            setActionsVisible(true);
        }, Platform.OS === 'ios' ? 280 : 80);
    };

    if (!mediaUrl) {
        return null;
    }

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                presentationStyle="overFullScreen"
                onRequestClose={handleClose}
                onDismiss={resetViewerState}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: gestureDismissed ? 0 : viewerOpacity,
                            transform: [{ translateY }]
                        }
                    ]}
                    {...dismissPanResponder.panHandlers}
                >
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
                </Animated.View>
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
