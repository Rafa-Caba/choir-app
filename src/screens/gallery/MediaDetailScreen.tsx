// src/screens/gallery/MediaDetailScreen.tsx

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import {
    useNavigation,
    useRoute,
    type NavigationProp,
    type RouteProp
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MediaActionsModal } from '../../components/shared/MediaActionsModal';
import {
    useDeleteGalleryImageMutation,
    useGalleryQuery,
    useSetGalleryFlagsMutation
} from '../../hooks/query/useGalleryData';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import type {
    GalleryFlag,
    GalleryImage,
    GalleryMediaDetailParams
} from '../../types/gallery';
import {
    getGalleryDisplayUri,
    getGalleryViewerPreviewUri,
    isRemoteMediaUri
} from '../../utils/mediaUtils';

type MediaDetailParams = {
    MediaDetailScreen: GalleryMediaDetailParams;
};

type ViewerGestureAxis = 'horizontal' | 'vertical' | null;
type MediaTransitionDirection = 'next' | 'previous';

const dismissDistance = 120;
const dismissVelocity = 1.05;
const horizontalSwipeDistance = 72;
const horizontalSwipeVelocity = 0.65;
const decodedImageUris = new Set<string>();

export const MediaDetailScreen = () => {
    const navigation = useNavigation<NavigationProp<MediaDetailParams>>();
    const route = useRoute<RouteProp<MediaDetailParams, 'MediaDetailScreen'>>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const [media, setMedia] = useState<GalleryImage>(route.params.media);
    const [loadingMedia, setLoadingMedia] = useState(
        route.params.media.mediaType === 'VIDEO'
    );
    const [previewReady, setPreviewReady] = useState(false);
    const [fullReady, setFullReady] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [actionsVisible, setActionsVisible] = useState(false);
    const [scale, setScale] = useState(1);

    const lastTap = useRef<number | null>(null);
    const gestureAxisRef = useRef<ViewerGestureAxis>(null);
    const transitioningRef = useRef(false);
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;

    const displayMediaUrl = getGalleryDisplayUri(media);
    const previewMediaUrl = media.id === route.params.media.id && route.params.previewUri
        ? route.params.previewUri
        : getGalleryViewerPreviewUri(media);
    const user = useAuthStore((state) => state.user);
    const galleryQuery = useGalleryQuery();
    const deleteMutation = useDeleteGalleryImageMutation();
    const flagsMutation = useSetGalleryFlagsMutation();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    const switchScaleStyle = useMemo(
        () => Platform.OS === 'ios' ? styles.iosSwitch : undefined,
        []
    );

    const mediaItems = useMemo<readonly GalleryImage[]>(() => {
        const loadedItems = galleryQuery.data ?? [];
        return loadedItems.length > 0 ? loadedItems : [route.params.media];
    }, [galleryQuery.data, route.params.media]);

    const currentIndex = useMemo(() => {
        const index = mediaItems.findIndex((item) => item.id === media.id);
        return index >= 0 ? index : 0;
    }, [media.id, mediaItems]);

    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < mediaItems.length - 1;
    const adjacentImageUris = useMemo(() => {
        return [
            mediaItems[currentIndex - 1],
            mediaItems[currentIndex + 1]
        ]
            .filter((item): item is GalleryImage => Boolean(
                item && item.mediaType === 'IMAGE'
            ))
            .flatMap((item) => [
                getGalleryViewerPreviewUri(item),
                getGalleryDisplayUri(item)
            ])
            .filter((uri, index, values) => values.indexOf(uri) === index);
    }, [currentIndex, mediaItems]);

    useEffect(() => {
        const previewWasDecoded = decodedImageUris.has(previewMediaUrl);
        const fullWasDecoded = decodedImageUris.has(displayMediaUrl) ||
            displayMediaUrl === previewMediaUrl;

        setPreviewReady(previewWasDecoded || fullWasDecoded);
        setFullReady(fullWasDecoded);
        setLoadingMedia(media.mediaType === 'VIDEO');
        imageOpacity.stopAnimation();
        imageOpacity.setValue(fullWasDecoded ? 1 : 0);
    }, [
        displayMediaUrl,
        imageOpacity,
        media.id,
        media.mediaType,
        previewMediaUrl
    ]);

    useEffect(() => {
        const candidates = [
            mediaItems[currentIndex - 1],
            mediaItems[currentIndex],
            mediaItems[currentIndex + 1]
        ].filter((item): item is GalleryImage => Boolean(item));

        candidates.forEach((item) => {
            const previewUri = getGalleryViewerPreviewUri(item);
            const displayUri = getGalleryDisplayUri(item);

            if (isRemoteMediaUri(previewUri)) {
                void Image.prefetch(previewUri).catch(() => false);
            }

            if (
                item.mediaType === 'IMAGE' &&
                displayUri !== previewUri &&
                isRemoteMediaUri(displayUri)
            ) {
                void Image.prefetch(displayUri).catch(() => false);
            }
        });
    }, [currentIndex, mediaItems]);

    const handlePreviewLoad = useCallback((): void => {
        decodedImageUris.add(previewMediaUrl);
        setPreviewReady(true);
        setLoadingMedia(false);

        if (displayMediaUrl === previewMediaUrl) {
            decodedImageUris.add(displayMediaUrl);
            setFullReady(true);
        }
    }, [displayMediaUrl, previewMediaUrl]);

    const handleImageLoad = useCallback((): void => {
        decodedImageUris.add(displayMediaUrl);
        setFullReady(true);
        setLoadingMedia(false);
        Animated.timing(imageOpacity, {
            toValue: 1,
            duration: previewReady ? 90 : 0,
            useNativeDriver: true
        }).start();
    }, [displayMediaUrl, imageOpacity, previewReady]);

    const viewerOpacity = useMemo(
        () => translateY.interpolate({
            inputRange: [0, screenHeight * 0.7],
            outputRange: [1, 0.35],
            extrapolate: 'clamp'
        }),
        [screenHeight, translateY]
    );

    const getThumbnail = (url: string): string => {
        if (!url) {
            return '';
        }

        return url.replace(/\.(mp4|mov|3gp|m4v|webm)$/iu, '.jpg');
    };

    const resetViewerPosition = useCallback((): void => {
        translateX.stopAnimation();
        translateY.stopAnimation();
        translateX.setValue(0);
        translateY.setValue(0);
    }, [translateX, translateY]);

    const restoreViewerPosition = useCallback((): void => {
        Animated.parallel([
            Animated.spring(translateX, {
                toValue: 0,
                damping: 20,
                stiffness: 220,
                mass: 0.8,
                useNativeDriver: true
            }),
            Animated.spring(translateY, {
                toValue: 0,
                damping: 20,
                stiffness: 220,
                mass: 0.8,
                useNativeDriver: true
            })
        ]).start();
    }, [translateX, translateY]);

    const dismissViewer = useCallback((): void => {
        transitioningRef.current = true;

        Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 190,
            useNativeDriver: true
        }).start(({ finished }) => {
            transitioningRef.current = false;

            if (finished) {
                navigation.goBack();
            }
        });
    }, [navigation, screenHeight, translateY]);

    const transitionToMedia = useCallback((
        targetIndex: number,
        direction: MediaTransitionDirection
    ): void => {
        const targetMedia = mediaItems[targetIndex];

        if (!targetMedia || transitioningRef.current) {
            restoreViewerPosition();
            return;
        }

        transitioningRef.current = true;
        const exitPosition = direction === 'next' ? -screenWidth : screenWidth;
        const entryPosition = direction === 'next' ? screenWidth : -screenWidth;

        Animated.timing(translateX, {
            toValue: exitPosition,
            duration: 150,
            useNativeDriver: true
        }).start(({ finished }) => {
            if (!finished) {
                transitioningRef.current = false;
                restoreViewerPosition();
                return;
            }

            imageOpacity.stopAnimation();
            imageOpacity.setValue(0);
            setMedia(targetMedia);
            setScale(1);
            translateY.setValue(0);
            translateX.setValue(entryPosition);

            requestAnimationFrame(() => {
                Animated.spring(translateX, {
                    toValue: 0,
                    damping: 22,
                    stiffness: 240,
                    mass: 0.8,
                    useNativeDriver: true
                }).start(() => {
                    transitioningRef.current = false;
                });
            });
        });
    }, [
        imageOpacity,
        mediaItems,
        restoreViewerPosition,
        screenWidth,
        translateX,
        translateY
    ]);

    const viewerPanResponder = useMemo(
        () => PanResponder.create({
            onMoveShouldSetPanResponder: (_event, gestureState) => {
                if (
                    scale > 1 ||
                    settingsVisible ||
                    actionsVisible ||
                    transitioningRef.current
                ) {
                    return false;
                }

                const horizontalDistance = Math.abs(gestureState.dx);
                const verticalDistance = Math.abs(gestureState.dy);

                if (
                    gestureState.dy > 10 &&
                    verticalDistance > horizontalDistance * 1.15
                ) {
                    gestureAxisRef.current = 'vertical';
                    return true;
                }

                if (
                    horizontalDistance > 12 &&
                    horizontalDistance > verticalDistance * 1.15
                ) {
                    gestureAxisRef.current = 'horizontal';
                    return true;
                }

                return false;
            },
            onPanResponderMove: (_event, gestureState) => {
                if (gestureAxisRef.current === 'vertical') {
                    translateY.setValue(Math.max(0, gestureState.dy));
                    return;
                }

                if (gestureAxisRef.current === 'horizontal') {
                    const reachesPreviousEdge = gestureState.dx > 0 && !hasPrevious;
                    const reachesNextEdge = gestureState.dx < 0 && !hasNext;
                    const resistance = reachesPreviousEdge || reachesNextEdge ? 0.28 : 1;
                    translateX.setValue(gestureState.dx * resistance);
                }
            },
            onPanResponderRelease: (_event, gestureState) => {
                const gestureAxis = gestureAxisRef.current;
                gestureAxisRef.current = null;

                if (gestureAxis === 'vertical') {
                    if (
                        gestureState.dy >= dismissDistance ||
                        gestureState.vy >= dismissVelocity
                    ) {
                        dismissViewer();
                        return;
                    }

                    restoreViewerPosition();
                    return;
                }

                if (gestureAxis === 'horizontal') {
                    const moveToNext =
                        gestureState.dx <= -horizontalSwipeDistance ||
                        gestureState.vx <= -horizontalSwipeVelocity;
                    const moveToPrevious =
                        gestureState.dx >= horizontalSwipeDistance ||
                        gestureState.vx >= horizontalSwipeVelocity;

                    if (moveToNext && hasNext) {
                        transitionToMedia(currentIndex + 1, 'next');
                        return;
                    }

                    if (moveToPrevious && hasPrevious) {
                        transitionToMedia(currentIndex - 1, 'previous');
                        return;
                    }
                }

                restoreViewerPosition();
            },
            onPanResponderTerminate: () => {
                gestureAxisRef.current = null;
                restoreViewerPosition();
            }
        }),
        [
            actionsVisible,
            currentIndex,
            dismissViewer,
            hasNext,
            hasPrevious,
            restoreViewerPosition,
            scale,
            settingsVisible,
            transitionToMedia,
            translateX,
            translateY
        ]
    );

    const handleDoubleTap = (): void => {
        const now = Date.now();

        if (lastTap.current && now - lastTap.current < 300) {
            setScale((current) => current > 1 ? 1 : 2);
            return;
        }

        lastTap.current = now;
    };

    const handleDelete = (): void => {
        if (Platform.OS === 'web') {
            if (window.confirm('¿Deseas eliminar este archivo?')) {
                deleteMutation.mutate(media.id, {
                    onSuccess: () => navigation.goBack(),
                    onError: () => Alert.alert('Error', 'No fue posible eliminar el archivo.')
                });
            }
            return;
        }

        Alert.alert('Eliminar', '¿Seguro que deseas eliminarlo?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                    deleteMutation.mutate(media.id, {
                        onSuccess: () => navigation.goBack(),
                        onError: () => Alert.alert('Error', 'No fue posible eliminar el archivo.')
                    });
                }
            }
        ]);
    };

    const toggleFlag = async (key: GalleryFlag, value: boolean): Promise<void> => {
        const previous = media;
        setMedia({ ...media, [key]: value });

        try {
            const updated = await flagsMutation.mutateAsync({
                id: media.id,
                flags: { [key]: value }
            });
            setMedia(updated);
        } catch {
            setMedia(previous);
            Alert.alert('Error', 'No fue posible actualizar la configuración.');
        }
    };

    const renderSwitch = (label: string, key: GalleryFlag, value: boolean) => (
        <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textColor }]}>{label}</Text>
            <View style={styles.switchControlContainer}>
                <Switch
                    style={switchScaleStyle}
                    value={value}
                    onValueChange={(nextValue) => void toggleFlag(key, nextValue)}
                    trackColor={{ false: '#767577', true: colors.primaryColor }}
                    thumbColor={value ? colors.buttonTextColor : '#f4f3f4'}
                    disabled={flagsMutation.isPending}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <MediaActionsModal
                visible={actionsVisible}
                onClose={() => setActionsVisible(false)}
                remoteUrl={media.imageUrl}
                filename={media.imageUrl.split('/').pop() || (
                    media.mediaType === 'VIDEO' ? 'video.mp4' : 'imagen.jpg'
                )}
                mimeType={media.mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'}
                kind={media.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE'}
                category="gallery"
            />

            <View pointerEvents="none" style={styles.preloadContainer}>
                {adjacentImageUris.map((uri) => (
                    <Image
                        key={`preload-${uri}`}
                        source={{ uri }}
                        style={styles.preloadImage}
                        fadeDuration={0}
                        onLoad={() => decodedImageUris.add(uri)}
                    />
                ))}
            </View>

            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.topBarActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setActionsVisible(true)}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
                    </TouchableOpacity>

                    {isAdmin && (
                        <>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
                                <Ionicons name="settings-outline" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconBtn, styles.deleteButton]}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <Animated.View
                style={[
                    styles.viewerSurface,
                    {
                        opacity: viewerOpacity,
                        transform: [{ translateX }, { translateY }]
                    }
                ]}
                {...viewerPanResponder.panHandlers}
            >
                <View style={styles.contentContainer}>
                    {loadingMedia && (media.mediaType === 'VIDEO' || (!previewReady && !fullReady)) && (
                        <ActivityIndicator
                            size="large"
                            color="#ffffff"
                            style={styles.loadingIndicator}
                        />
                    )}

                    {media.mediaType === 'VIDEO' ? (
                        <Video
                            key={`video-${media.id}`}
                            style={styles.media}
                            source={{ uri: displayMediaUrl }}
                            posterSource={{ uri: previewMediaUrl || getThumbnail(media.imageUrl) }}
                            usePoster
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping
                            shouldPlay
                            isMuted={Platform.OS === 'web'}
                            onLoadStart={() => setLoadingMedia(true)}
                            onLoad={() => setLoadingMedia(false)}
                            onError={() => setLoadingMedia(false)}
                        />
                    ) : (
                        <ScrollView
                            key={`scroll-${media.id}`}
                            contentContainerStyle={styles.imageScrollContent}
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                            centerContent
                            scrollEnabled={scale > 1}
                        >
                            <TouchableWithoutFeedback onPress={handleDoubleTap}>
                                <View style={styles.imageStage}>
                                    <Image
                                        key={`preview-${media.id}`}
                                        source={{ uri: previewMediaUrl }}
                                        style={styles.media}
                                        resizeMode="contain"
                                        fadeDuration={0}
                                        onLoad={handlePreviewLoad}
                                        onError={() => setLoadingMedia(false)}
                                    />
                                    {displayMediaUrl !== previewMediaUrl && (
                                        <Animated.Image
                                            key={`full-${media.id}`}
                                            source={{ uri: displayMediaUrl }}
                                            style={[
                                                styles.fullResolutionImage,
                                                { opacity: imageOpacity },
                                                Platform.OS === 'web'
                                                    ? {
                                                        width: `${scale * 100}%`,
                                                        height: `${scale * 100}%`
                                                    }
                                                    : undefined
                                            ]}
                                            resizeMode="contain"
                                            fadeDuration={0}
                                            onLoadStart={() => {
                                                if (!previewReady) {
                                                    setLoadingMedia(true);
                                                }
                                            }}
                                            onLoad={handleImageLoad}
                                            onError={() => setLoadingMedia(false)}
                                        />
                                    )}
                                </View>
                            </TouchableWithoutFeedback>
                        </ScrollView>
                    )}
                </View>

                {!settingsVisible && scale === 1 && (media.title || media.description) && (
                    <View style={styles.infoBar}>
                        <Text style={styles.title}>{media.title}</Text>
                        {media.description ? (
                            <Text style={styles.desc}>{media.description}</Text>
                        ) : null}
                    </View>
                )}
            </Animated.View>

            <Modal
                animationType="slide"
                transparent
                visible={settingsVisible}
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.cardColor,
                                paddingBottom: Math.max(insets.bottom, 16) + 16
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>Configuración de imagen</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalScrollContent}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Ubicación</Text>
                            {renderSwitch('Logo de la app', 'imageLogo', media.imageLogo)}
                            {renderSwitch('Pantalla de inicio', 'imageStart', media.imageStart)}
                            {renderSwitch('Barra superior', 'imageTopBar', media.imageTopBar)}
                            {renderSwitch('Sección Nosotros', 'imageUs', media.imageUs)}

                            <View
                                style={[
                                    styles.separator,
                                    { backgroundColor: colors.borderColor }
                                ]}
                            />

                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Visibilidad</Text>
                            {renderSwitch('Mostrar en la galería', 'imageGallery', media.imageGallery)}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000'
    },
    viewerSurface: {
        flex: 1,
        backgroundColor: '#000000'
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden'
    },
    loadingIndicator: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3
    },
    preloadContainer: {
        position: 'absolute',
        top: -10,
        left: -10,
        width: 1,
        height: 1,
        opacity: 0.01
    },
    preloadImage: {
        width: 1,
        height: 1
    },
    imageScrollContent: {
        flexGrow: 1,
        justifyContent: 'center'
    },
    imageStage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000000'
    },
    fullResolutionImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%'
    },
    media: {
        width: '100%',
        height: '100%'
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10
    },
    topBarActions: {
        flexDirection: 'row',
        gap: 10
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 50,
        marginLeft: 10
    },
    deleteButton: {
        backgroundColor: 'rgba(255,0,0,0.5)'
    },
    infoBar: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 15,
        borderRadius: 12
    },
    title: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    desc: {
        color: '#dddddd',
        marginTop: 4,
        fontSize: 14
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 24,
        maxHeight: '60%',
        elevation: 10,
        overflow: 'visible'
    },
    modalScrollContent: {
        paddingBottom: 4,
        paddingRight: 8
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        opacity: 0.7
    },
    separator: {
        height: 1,
        marginVertical: 15
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: 6
    },
    switchLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginRight: 16
    },
    switchControlContainer: {
        width: 76,
        minWidth: 76,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 4,
        overflow: 'visible'
    },
    iosSwitch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
    }
});
