import React, { useEffect, useState } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ScrollView, 
    Modal, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useGalleryStore } from '../../store/useGalleryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../LoadingScreen';
import { getCloudinaryThumbnail } from '../../utils/mediaUtils'; // Import util

export const GalleryScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;
    
    const { images, fetchImages, addImage, loading } = useGalleryStore();
    const { user } = useAuthStore();

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // --- Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempUri, setTempUri] = useState<string | null>(null);
    const [tempType, setTempType] = useState<'image' | 'video'>('image'); // Track type
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (images.length === 0) fetchImages();
    }, []);

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // ALLOW VIDEO
            quality: 0.7,
            videoMaxDuration: 60, // Optional limit
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
            Alert.alert("Faltan datos", "Por favor agrega un título.");
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
            Alert.alert("Error", "No se pudo subir el archivo.");
        }
    };

    if (loading && images.length === 0) return <LoadingScreen />;

    const featuredImages = images.filter(i => i.mediaType === 'IMAGE').slice(0, 5);

    // Grid Item Render
    const renderGridItem = ({ item }: { item: any }) => {
        // Generate Thumbnail or use placeholder
        const thumbUri = getCloudinaryThumbnail(item.imageUrl) || 'https://via.placeholder.com/150';

        return (
            <TouchableOpacity 
                style={styles.gridItem}
                onPress={() => navigation.navigate('MediaDetailScreen', { media: item })}
            >
                <Image 
                    source={{ uri: thumbUri }} 
                    style={styles.gridImage} 
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
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Galería</Text>
                {canEdit && (
                    <TouchableOpacity onPress={handlePickMedia} style={[styles.addBtn, { backgroundColor: colors.button }]}>
                        <Ionicons name="add" size={24} color={colors.buttonText} />
                        <Text style={[styles.addBtnText, { color: colors.buttonText }]}>Agregar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Featured (Images Only for aesthetic) */}
            {featuredImages.length > 0 && (
                <View style={[styles.featuredContainer, { backgroundColor: colors.card }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                        {featuredImages.map((img, index) => (
                            <Image 
                                key={img.id} 
                                source={{ uri: img.imageUrl }} 
                                style={[styles.featuredImage, { transform: [{ rotate: index % 2 === 0 ? '-2deg' : '2deg' }], borderColor: colors.background }]} 
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={images}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 5 }}
                renderItem={renderGridItem}
                onRefresh={fetchImages}
                refreshing={loading}
            />

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => !uploading && setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {tempType === 'video' ? 'Nuevo Video' : 'Nueva Imagen'}
                        </Text>
                        
                        {tempUri && (
                            <View>
                                <Image source={{ uri: tempUri }} style={styles.previewThumb} />
                                {tempType === 'video' && (
                                    <View style={[styles.videoOverlay, {justifyContent: 'center', alignItems: 'center'}]}>
                                        <Ionicons name="videocam" size={40} color="white" />
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} 
                            value={newTitle} onChangeText={setNewTitle}
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>Descripción</Text>
                        <TextInput 
                            style={[styles.input, { height: 60, backgroundColor: colors.card, color: colors.text }]} 
                            value={newDesc} onChangeText={setNewDesc} multiline
                        />

                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.button }]} onPress={handleConfirmUpload} disabled={uploading}>
                            {uploading ? <ActivityIndicator color={colors.buttonText}/> : <Text style={[styles.uploadBtnText, { color: colors.buttonText }]}>Subir</Text>}
                        </TouchableOpacity>
                        
                        {!uploading && (
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
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
    featuredImage: { width: 250, height: 180, borderRadius: 15, marginRight: 15, borderWidth: 4 },
    
    // Grid
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