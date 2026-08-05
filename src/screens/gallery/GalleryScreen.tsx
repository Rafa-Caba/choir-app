// src/screens/gallery/GalleryScreen.tsx

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
    useAddGalleryImageMutation,
    useGalleryQuery
} from '../../hooks/query/useGalleryData';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../LoadingScreen';
import { getCloudinaryThumbnail } from '../../utils/mediaUtils';
import type { GalleryImage } from '../../types/gallery';

type GalleryNavigationParams = {
    readonly MediaDetailScreen: { readonly media: GalleryImage };
};

export const GalleryScreen = () => {
    const navigation = useNavigation<NavigationProp<GalleryNavigationParams>>();
    const colors = useTheme().currentTheme;
    const galleryQuery = useGalleryQuery();
    const addImageMutation = useAddGalleryImageMutation();
    const images = galleryQuery.data ?? [];
    const user = useAuthStore((state) => state.user);
    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    const [modalVisible, setModalVisible] = useState(false);
    const [tempUri, setTempUri] = useState<string | null>(null);
    const [tempType, setTempType] = useState<'image' | 'video'>('image');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const getSafeThumbnail = (imageUrl: string, mediaType: string): string => {
        if (!imageUrl) {
            return 'https://via.placeholder.com/150';
        }

        if (mediaType === 'VIDEO') {
            return imageUrl.replace(/\.(mp4|mov|3gp|m4v|webm)$/iu, '.jpg');
        }

        return getCloudinaryThumbnail(imageUrl) || imageUrl;
    };

    const resetUploadForm = (): void => {
        setTempUri(null);
        setTempType('image');
        setNewTitle('');
        setNewDesc('');
    };

    const closeUploadModal = (): void => {
        if (addImageMutation.isPending) {
            return;
        }

        Keyboard.dismiss();
        setModalVisible(false);
        resetUploadForm();
    };

    const handlePickMedia = async (): Promise<void> => {
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
            setTempUri(asset.uri);
            setTempType(asset.type === 'video' ? 'video' : 'image');
            setNewTitle('');
            setNewDesc('');
            setModalVisible(true);
        } catch (error) {
            console.error('Gallery picker failed', error);
            Alert.alert('Error', 'No fue posible abrir la galería del dispositivo.');
        }
    };

    const handleConfirmUpload = async (): Promise<void> => {
        if (!newTitle.trim() || !tempUri) {
            Alert.alert('Datos incompletos', 'Agrega un título.');
            return;
        }

        Keyboard.dismiss();

        try {
            await addImageMutation.mutateAsync({
                title: newTitle.trim(),
                description: newDesc.trim(),
                imageUri: tempUri,
                imageGallery: true
            });
            setModalVisible(false);
            resetUploadForm();
        } catch {
            Alert.alert('Error', 'No fue posible subir el archivo. Intenta nuevamente.');
        }
    };

    if (galleryQuery.isLoading && images.length === 0) {
        return <LoadingScreen />;
    }

    const featuredItems = images.slice(0, 5);

    const renderGridItem = ({ item }: { readonly item: GalleryImage }) => {
        const displayUrl = item.mediaType === 'VIDEO'
            ? item.imageUrl
            : item.cachedImageUrl ?? item.imageUrl;
        const thumbUri = getSafeThumbnail(displayUrl, item.mediaType);

        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate('MediaDetailScreen', { media: item })}
            >
                <Image
                    source={{ uri: thumbUri }}
                    style={[styles.gridImage, { backgroundColor: colors.cardColor }]}
                    resizeMode="cover"
                />
                {item.mediaType === 'VIDEO' && (
                    <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={30} color="rgba(255,255,255,0.8)" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Galería</Text>
                {canEdit && (
                    <TouchableOpacity
                        onPress={() => void handlePickMedia()}
                        style={[styles.addBtn, { backgroundColor: colors.buttonColor }]}
                    >
                        <Ionicons name="add" size={24} color={colors.buttonTextColor} />
                        <Text style={[styles.addBtnText, { color: colors.buttonTextColor }]}>Agregar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {featuredItems.length > 0 && (
                <View style={[styles.featuredContainer, { backgroundColor: colors.cardColor }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredScrollContent}
                    >
                        {featuredItems.map((item, index) => {
                            const displayUrl = item.mediaType === 'VIDEO'
                                ? item.imageUrl
                                : item.cachedImageUrl ?? item.imageUrl;
                            const thumb = getSafeThumbnail(displayUrl, item.mediaType);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate('MediaDetailScreen', { media: item })}
                                >
                                    <View style={[
                                        styles.featuredImageWrapper,
                                        {
                                            transform: [{ rotate: index % 2 === 0 ? '-2deg' : '2deg' }],
                                            borderColor: colors.backgroundColor,
                                            backgroundColor: colors.cardColor
                                        }
                                    ]}>
                                        <Image
                                            source={{ uri: thumb }}
                                            style={styles.featuredImage}
                                            resizeMode="cover"
                                        />
                                        {item.mediaType === 'VIDEO' && (
                                            <View style={[styles.videoOverlay, styles.featuredVideoOverlay]}>
                                                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={images}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                renderItem={renderGridItem}
                onRefresh={() => void galleryQuery.refetch()}
                refreshing={galleryQuery.isRefetching}
            />

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeUploadModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                >
                    <Pressable style={styles.modalBackdrop} onPress={closeUploadModal}>
                        <Pressable
                            style={[styles.modalShell, { backgroundColor: colors.backgroundColor }]}
                            onPress={(event) => event.stopPropagation()}
                        >
                            <ScrollView
                                contentContainerStyle={styles.modalScrollContent}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                                onScrollBeginDrag={Keyboard.dismiss}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                                    {tempType === 'video' ? 'Nuevo video' : 'Nueva imagen'}
                                </Text>

                                {tempUri && (
                                    tempType === 'video' ? (
                                        <View style={[styles.previewThumb, styles.videoPreview]}>
                                            <Ionicons name="videocam" size={60} color="white" />
                                        </View>
                                    ) : (
                                        <Image source={{ uri: tempUri }} style={styles.previewThumb} />
                                    )
                                )}

                                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Título</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.cardColor,
                                            color: colors.textColor,
                                            borderColor: colors.borderColor
                                        }
                                    ]}
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    placeholder="Título de la imagen"
                                    placeholderTextColor={colors.secondaryTextColor}
                                    autoCorrect
                                    spellCheck
                                    autoCapitalize="sentences"
                                    returnKeyType="next"
                                    editable={!addImageMutation.isPending}
                                />

                                <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Descripción</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.descriptionInput,
                                        {
                                            backgroundColor: colors.cardColor,
                                            color: colors.textColor,
                                            borderColor: colors.borderColor
                                        }
                                    ]}
                                    value={newDesc}
                                    onChangeText={setNewDesc}
                                    multiline
                                    textAlignVertical="top"
                                    placeholder="Descripción opcional"
                                    placeholderTextColor={colors.secondaryTextColor}
                                    autoCorrect
                                    spellCheck
                                    autoCapitalize="sentences"
                                    editable={!addImageMutation.isPending}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={closeUploadModal}
                                        style={styles.cancelBtn}
                                        disabled={addImageMutation.isPending}
                                    >
                                        <Text style={[styles.cancelText, { color: colors.secondaryTextColor }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.uploadBtn, { backgroundColor: colors.buttonColor }]}
                                        onPress={() => void handleConfirmUpload()}
                                        disabled={addImageMutation.isPending}
                                    >
                                        {addImageMutation.isPending ? (
                                            <ActivityIndicator color={colors.buttonTextColor} />
                                        ) : (
                                            <Text style={[styles.uploadBtnText, { color: colors.buttonTextColor }]}>Subir</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 10
    },
    title: { fontSize: 28, fontWeight: 'bold' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    addBtnText: { fontWeight: '600', marginLeft: 3 },
    featuredContainer: { height: 220, marginBottom: 20, justifyContent: 'center', paddingVertical: 10 },
    featuredScrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    featuredImageWrapper: {
        width: 250,
        height: 180,
        borderRadius: 15,
        marginRight: 15,
        borderWidth: 4,
        overflow: 'hidden'
    },
    featuredImage: { width: '100%', height: '100%' },
    featuredVideoOverlay: { borderRadius: 15 },
    gridContent: { paddingBottom: 20, paddingHorizontal: 5 },
    gridItem: { flex: 1, margin: 2, aspectRatio: 1, position: 'relative' },
    gridImage: { width: '100%', height: '100%', borderRadius: 4 },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    modalOverlay: { flex: 1 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalShell: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '90%',
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden'
    },
    modalScrollContent: { padding: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    previewThumb: { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 },
    videoPreview: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    label: { fontWeight: '600', marginBottom: 5 },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16
    },
    descriptionInput: { minHeight: 96 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
    uploadBtn: { minWidth: 110, padding: 15, borderRadius: 10, alignItems: 'center' },
    uploadBtnText: { fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { alignItems: 'center', padding: 15, marginRight: 8 },
    cancelText: { fontWeight: '600' }
});
