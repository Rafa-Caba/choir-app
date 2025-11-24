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
import { GalleryPhoto } from '../../components/GalleryPhoto';
import { LoadingScreen } from '../LoadingScreen';

export const GalleryScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    
    // Theme Hook
    const { currentTheme } = useTheme();
    
    const { images, fetchImages, addImage, loading } = useGalleryStore();
    const { user } = useAuthStore();

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // --- Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tempImageUri, setTempImageUri] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (images.length === 0) fetchImages();
    }, []);

    // 1. Pick Image -> Open Modal
    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!result.canceled) {
            setTempImageUri(result.assets[0].uri);
            setNewTitle('');
            setNewDesc('');
            setModalVisible(true);
        }
    };

    // 2. Confirm -> Upload to API
    const handleConfirmUpload = async () => {
        if (!newTitle.trim() || !tempImageUri) {
            Alert.alert("Faltan datos", "Por favor agrega un título.");
            return;
        }

        setUploading(true);
        const success = await addImage({
            title: newTitle,
            description: newDesc,
            imageUri: tempImageUri,
            imageGallery: true
        });
        setUploading(false);

        if (success) {
            setModalVisible(false);
            setTempImageUri(null);
        } else {
            Alert.alert("Error", "No se pudo subir la imagen.");
        }
    };

    if (loading && images.length === 0) return <LoadingScreen />;

    const featuredImages = images.slice(0, 5);

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: currentTheme.colors.background }]}>
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                    Galería
                </Text>
                {canEdit && (
                    <TouchableOpacity 
                        onPress={handlePickImage} 
                        style={[styles.addBtn, { backgroundColor: currentTheme.colors.button }]}
                    >
                        <Ionicons name="add" size={24} color={currentTheme.colors.buttonText} />
                        <Text style={[styles.addBtnText, { color: currentTheme.colors.buttonText }]}>
                            Agregar
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Featured Section */}
            {featuredImages.length > 0 && (
                <View style={[styles.featuredContainer, { backgroundColor: currentTheme.colors.cardBackground }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                        {featuredImages.map((img, index) => (
                            <Image 
                                key={img.id} 
                                source={{ uri: img.imageUrl }} 
                                style={[
                                    styles.featuredImage,
                                    { 
                                        transform: [{ rotate: index % 2 === 0 ? '-2deg' : '2deg' }],
                                        borderColor: currentTheme.colors.background 
                                    }
                                ]} 
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Grid */}
            <FlatList
                data={images}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 5 }}
                renderItem={({ item }) => (
                    <GalleryPhoto 
                        uri={item.imageUrl} 
                        onPress={() => navigation.navigate('ImageDetail', { image: item })} 
                    />
                )}
                onRefresh={fetchImages}
                refreshing={loading}
            />

            {/* --- Upload Modal --- */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !uploading && setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: currentTheme.colors.background }]}>
                        <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                            Nueva Imagen
                        </Text>
                        
                        {tempImageUri && (
                            <Image source={{ uri: tempImageUri }} style={styles.previewThumb} />
                        )}

                        <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                            Título
                        </Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }
                            ]} 
                            placeholder="Ej. Ensayo General"
                            placeholderTextColor={currentTheme.colors.textSecondary}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                            Descripción (Opcional)
                        </Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { height: 60, backgroundColor: currentTheme.colors.card, color: currentTheme.colors.text }
                            ]} 
                            placeholder="Detalles..."
                            placeholderTextColor={currentTheme.colors.textSecondary}
                            value={newDesc}
                            onChangeText={setNewDesc}
                            multiline
                        />

                        <TouchableOpacity 
                            style={[styles.uploadBtn, { backgroundColor: currentTheme.colors.button }]} 
                            onPress={handleConfirmUpload}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color={currentTheme.colors.buttonText}/>
                            ) : (
                                <Text style={[styles.uploadBtnText, { color: currentTheme.colors.buttonText }]}>
                                    Subir Imagen
                                </Text>
                            )}
                        </TouchableOpacity>
                        
                        {!uploading && (
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={[styles.cancelText, { color: currentTheme.colors.textSecondary }]}>
                                    Cancelar
                                </Text>
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
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        marginTop: 10, 
        marginBottom: 10 
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold' 
    },
    addBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20 
    },
    addBtnText: { 
        fontWeight: '600', 
        marginLeft: 3 
    },
    featuredContainer: { 
        height: 220, 
        marginBottom: 20, 
        justifyContent: 'center', 
        paddingVertical: 10 
    },
    featuredImage: { 
        width: 250, 
        height: 180, 
        borderRadius: 15, 
        marginRight: 15, 
        borderWidth: 4, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 5 
    },
    
    // Modal Styles
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        padding: 20 
    },
    modalContent: { 
        borderRadius: 20, 
        padding: 20, 
        alignItems: 'stretch' 
    },
    modalTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 15 
    },
    previewThumb: { 
        width: '100%', 
        height: 200, 
        borderRadius: 10, 
        marginBottom: 20, 
        objectFit: 'cover' 
    },
    label: { 
        fontWeight: '600', 
        marginBottom: 5 
    },
    input: { 
        borderRadius: 8, 
        padding: 10, 
        marginBottom: 15, 
        fontSize: 16 
    },
    uploadBtn: { 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center', 
        marginTop: 10 
    },
    uploadBtnText: { 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    cancelBtn: { 
        alignItems: 'center', 
        padding: 15 
    },
    cancelText: { 
        fontWeight: '600' 
    }
});