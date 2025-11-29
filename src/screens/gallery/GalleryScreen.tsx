import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ScrollView,
    Modal, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useGalleryStore } from '../../store/useGalleryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../LoadingScreen';
import { getCloudinaryThumbnail } from '../../utils/mediaUtils';

export const GalleryScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { images, fetchImages, addImage, loading } = useGalleryStore();
    const { user } = useAuthStore();

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // --- Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempUri, setTempUri] = useState<string | null>(null);
    const [tempType, setTempType] = useState<'image' | 'video'>('image');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (images.length === 0) fetchImages();
    }, []);

    // --- THUMBNAIL HELPER ---
    const getSafeThumbnail = (imageUrl: string, mediaType: string) => {
        if (!imageUrl) return 'https://via.placeholder.com/150';

        if (mediaType === 'VIDEO') {
            // 🛠️ FIX: Ensure we get a JPG. 
            // If it's Cloudinary, we can also append transformations here if needed.
            return imageUrl.replace(/\.(mp4|mov|3gp|m4v|webm)$/i, '.jpg');
        }

        return getCloudinaryThumbnail(imageUrl) || imageUrl;
    };

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.7,
            videoMaxDuration: 60,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setTempUri(asset.uri);
            setTempType(asset.type === 'video' ? 'video' : 'image');
            setNewTitle('');
            setNewDesc('');
            setModalVisible(true);
        }
    };

    const handleConfirmUpload = async () => {
        if (!newTitle.trim() || !tempUri) {
            Alert.alert("Missing Data", "Please add a title.");
            return;
        }

        setUploading(true);
        const success = await addImage({
            title: newTitle,
            description: newDesc,
            imageUri: tempUri,
            imageGallery: true
        });
        setUploading(false);

        if (success) {
            setModalVisible(false);
            setTempUri(null);
        } else {
            Alert.alert("Error", "Upload failed.");
        }
    };

    if (loading && images.length === 0) return <LoadingScreen />;

    // 🆕 Allow both Images AND Videos in Carousel (Top 5)
    const featuredItems = images.slice(0, 5);

    const renderGridItem = ({ item }: { item: any }) => {
        const thumbUri = getSafeThumbnail(item.imageUrl, item.mediaType);

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
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.backgroundColor }]}>

            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textColor }]}>Gallery</Text>
                {canEdit && (
                    <TouchableOpacity onPress={handlePickMedia} style={[styles.addBtn, { backgroundColor: colors.buttonColor }]}>
                        <Ionicons name="add" size={24} color={colors.buttonTextColor} />
                        <Text style={[styles.addBtnText, { color: colors.buttonTextColor }]}>Add</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Featured Carousel */}
            {featuredItems.length > 0 && (
                <View style={[styles.featuredContainer, { backgroundColor: colors.cardColor }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}>
                        {featuredItems.map((item, index) => {
                            const thumb = getSafeThumbnail(item.imageUrl, item.mediaType);

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
                                            backgroundColor: colors.cardColor // Fallback bg
                                        }
                                    ]}>
                                        <Image
                                            source={{ uri: thumb }}
                                            style={styles.featuredImage}
                                            resizeMode="cover"
                                        />
                                        {item.mediaType === 'VIDEO' && (
                                            <View style={[styles.videoOverlay, { borderRadius: 15 }]}>
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
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 5 }}
                renderItem={renderGridItem}
                onRefresh={fetchImages}
                refreshing={loading}
            />

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => !uploading && setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textColor }]}>
                            {tempType === 'video' ? 'New Video' : 'New Image'}
                        </Text>

                        {tempUri && (
                            <View>
                                {tempType === 'video' ? (
                                    <View style={[styles.previewThumb, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="videocam" size={60} color="white" />
                                    </View>
                                ) : (
                                    <Image source={{ uri: tempUri }} style={styles.previewThumb} />
                                )}
                            </View>
                        )}

                        <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.cardColor, color: colors.textColor }]}
                            value={newTitle} onChangeText={setNewTitle}
                            placeholderTextColor={colors.secondaryTextColor}
                        />

                        <Text style={[styles.label, { color: colors.secondaryTextColor }]}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: 60, backgroundColor: colors.cardColor, color: colors.textColor }]}
                            value={newDesc} onChangeText={setNewDesc} multiline
                            placeholderTextColor={colors.secondaryTextColor}
                        />

                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.buttonColor }]} onPress={handleConfirmUpload} disabled={uploading}>
                            {uploading ? <ActivityIndicator color={colors.buttonTextColor} /> : <Text style={[styles.uploadBtnText, { color: colors.buttonTextColor }]}>Upload</Text>}
                        </TouchableOpacity>

                        {!uploading && (
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={[styles.cancelText, { color: colors.secondaryTextColor }]}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
    title: { fontSize: 28, fontWeight: 'bold' },
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    addBtnText: { fontWeight: '600', marginLeft: 3 },

    featuredContainer: { height: 220, marginBottom: 20, justifyContent: 'center', paddingVertical: 10 },
    // Wrapper handles the border and rotation now
    featuredImageWrapper: {
        width: 250, height: 180, borderRadius: 15, marginRight: 15, borderWidth: 4,
        overflow: 'hidden' // Critical to clip image to border radius
    },
    featuredImage: { width: '100%', height: '100%' },

    gridItem: { flex: 1, margin: 2, aspectRatio: 1, position: 'relative' },
    gridImage: { width: '100%', height: '100%', borderRadius: 4 },
    videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 20, alignItems: 'stretch' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    previewThumb: { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 },
    label: { fontWeight: '600', marginBottom: 5 },
    input: { borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    uploadBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    uploadBtnText: { fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { alignItems: 'center', padding: 15 },
    cancelText: { fontWeight: '600' }
});