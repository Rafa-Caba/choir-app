// src/screens/gallery/MediaDetailScreen.tsx

import React, { useState, useRef } from 'react';
import {
    View, Image, TouchableOpacity, StyleSheet, Text,
    Alert, ActivityIndicator, Modal, Switch, ScrollView, Platform,
    TouchableWithoutFeedback
} from 'react-native';
import {
    useNavigation,
    useRoute,
    type NavigationProp,
    type RouteProp
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useAuthStore } from '../../store/useAuthStore';
import {
    useDeleteGalleryImageMutation,
    useSetGalleryFlagsMutation
} from '../../hooks/query/useGalleryData';
import { useTheme } from '../../context/ThemeContext';
import type { GalleryFlag, GalleryImage } from '../../types/gallery';

type MediaDetailParams = {
    MediaDetailScreen: { readonly media: GalleryImage };
};

export const MediaDetailScreen = () => {
    const navigation = useNavigation<NavigationProp<MediaDetailParams>>();
    const route = useRoute<RouteProp<MediaDetailParams, 'MediaDetailScreen'>>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const insets = useSafeAreaInsets();

    const [media, setMedia] = useState<GalleryImage>(route.params.media);
    const displayMediaUrl = media.cachedImageUrl ?? media.imageUrl;
    const { user } = useAuthStore();
    const deleteMutation = useDeleteGalleryImageMutation();
    const flagsMutation = useSetGalleryFlagsMutation();

    const [loadingMedia, setLoadingMedia] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);

    // Zoom
    const [scale, setScale] = useState(1);
    const lastTap = useRef<number | null>(null);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const getThumbnail = (url: string) => {
        if (!url) return '';
        return url.replace(/\.(mp4|mov|3gp|m4v|webm)$/i, '.jpg');
    };

    const handleDoubleTap = () => {
        const now = Date.now();
        if (lastTap.current && (now - lastTap.current) < 300) {
            setScale(scale > 1 ? 1 : 2);
        } else {
            lastTap.current = now;
        }
    };

    const handleDownload = async () => {
        try {
            const filename = media.imageUrl.split('/').pop() || 'download';
            if (Platform.OS === 'web') {
                const link = document.createElement('a');
                link.href = media.imageUrl;
                link.download = filename;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                const fileUri = FileSystem.documentDirectory + filename;
                const { uri } = await FileSystem.downloadAsync(media.imageUrl, fileUri);
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                } else {
                    Alert.alert("Descarga completada", "El archivo se guardó correctamente.");
                }
            }
        } catch (e) {
            Alert.alert("Error", "No fue posible descargar el archivo.");
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Deseas eliminar este archivo?")) {
                deleteMutation.mutate(media.id, {
                    onSuccess: () => navigation.goBack(),
                    onError: () => Alert.alert('Error', 'No fue posible eliminar el archivo.')
                });
            }
        } else {
            Alert.alert("Eliminar", "¿Seguro que deseas eliminarlo?", [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar", style: "destructive",
                    onPress: () => {
                        deleteMutation.mutate(media.id, {
                            onSuccess: () => navigation.goBack(),
                            onError: () => Alert.alert('Error', 'No fue posible eliminar el archivo.')
                        });
                    }
                }
            ]);
        }
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
            <Text
                numberOfLines={2}
                style={[styles.switchLabel, { color: colors.textColor }]}
            >
                {label}
            </Text>
            <View style={styles.switchControlContainer}>
                <Switch
                    style={styles.switchControl}
                    value={value}
                    onValueChange={(nextValue) => void toggleFlag(key, nextValue)}
                    trackColor={{ false: '#767577', true: colors.primaryColor }}
                    thumbColor={value ? colors.buttonTextColor : '#f4f3f4'}
                    ios_backgroundColor="#767577"
                    disabled={flagsMutation.isPending}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleDownload}>
                        <Ionicons name="download-outline" size={24} color="white" />
                    </TouchableOpacity>

                    {isAdmin && (
                        <>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
                                <Ionicons name="settings-outline" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(255,0,0,0.5)' }]} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={24} color="white" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Viewer */}
            <View style={styles.contentContainer}>
                {loadingMedia && <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />}

                {media.mediaType === 'VIDEO' ? (
                    <Video
                        style={styles.media}
                        source={{ uri: displayMediaUrl }}
                        posterSource={{ uri: getThumbnail(media.imageUrl) }}
                        usePoster={true}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay
                        isMuted={Platform.OS === 'web'}
                        onLoadStart={() => setLoadingMedia(true)}
                        onLoad={() => setLoadingMedia(false)}
                    />
                ) : (
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        maximumZoomScale={3}
                        minimumZoomScale={1}
                        centerContent
                        scrollEnabled={scale > 1}
                    >
                        <TouchableWithoutFeedback onPress={handleDoubleTap}>
                            <Image
                                source={{ uri: displayMediaUrl }}
                                style={[
                                    styles.media,
                                    {
                                        width: Platform.OS === 'web' ? `${scale * 100}%` : '100%',
                                        height: Platform.OS === 'web' ? `${scale * 100}%` : '100%',
                                    }
                                ]}
                                resizeMode="contain"
                            />
                        </TouchableWithoutFeedback>
                    </ScrollView>
                )}
            </View>

            {/* Info Bar */}
            {!settingsVisible && scale === 1 && (media.title || media.description) && (
                <View style={styles.infoBar}>
                    <Text style={styles.title}>{media.title}</Text>
                    {media.description ? <Text style={styles.desc}>{media.description}</Text> : null}
                </View>
            )}

            {/* Settings Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={settingsVisible}
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.cardColor,
                                paddingBottom: Math.max(insets.bottom, 20)
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
                            contentContainerStyle={styles.settingsScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Ubicación</Text>
                            {renderSwitch("Logo de la app", "imageLogo", media.imageLogo)}
                            {renderSwitch("Pantalla de inicio", "imageStart", media.imageStart)}
                            {renderSwitch("Barra superior", "imageTopBar", media.imageTopBar)}
                            {renderSwitch("Sección Nosotros", "imageUs", media.imageUs)}

                            <View style={{ height: 1, backgroundColor: colors.borderColor, marginVertical: 15 }} />

                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Visibilidad</Text>
                            {renderSwitch("Mostrar en la galería", "imageGallery", media.imageGallery)}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    contentContainer: { flex: 1, overflow: 'hidden' },
    media: { width: '100%', height: '100%' },
    topBar: {
        position: 'absolute', top: 50, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
        zIndex: 10
    },
    iconBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, marginLeft: 10 },
    infoBar: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 12
    },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    desc: { color: '#ddd', marginTop: 4, fontSize: 14 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 24,
        height: '52%',
        width: '100%',
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        opacity: 0.7
    },
    settingsScrollContent: { paddingBottom: 8 },
    switchRow: {
        width: '100%',
        minHeight: 48,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 4
    },
    switchLabel: { fontSize: 16, fontWeight: '500', flex: 1, paddingRight: 16 },
    switchControlContainer: {
        width: 64,
        minHeight: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 4
    },
    switchControl: { transform: [{ scaleX: 0.92 }, { scaleY: 0.92 }] }
});
