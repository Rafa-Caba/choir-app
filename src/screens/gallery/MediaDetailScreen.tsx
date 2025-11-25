import React, { useState } from 'react';
import { 
    View, Image, TouchableOpacity, StyleSheet, Dimensions, Text, 
    Alert, ActivityIndicator, Modal, Switch, ScrollView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

import { useAuthStore } from '../../store/useAuthStore';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const MediaDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;
    
    // We need local state for the object because flags change
    const [media, setMedia] = useState(route.params.media);

    const { user } = useAuthStore();
    const { removeImage, setFlags } = useGalleryStore();

    const [loadingMedia, setLoadingMedia] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const handleDelete = () => {
        Alert.alert("Eliminar", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Eliminar", style: "destructive", 
                onPress: async () => {
                    await removeImage(media.id);
                    navigation.goBack();
                }
            }
        ]);
    };

    const toggleFlag = async (key: string, value: boolean) => {
        // 1. Update Local State immediately for UI responsiveness
        const updatedMedia = { ...media, [key]: value };
        setMedia(updatedMedia);

        // 2. Update Store & Server
        await setFlags(media.id, { [key]: value });
    };

    const renderSwitch = (label: string, key: string, value: boolean) => (
        <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
            <Switch 
                value={value} 
                onValueChange={(val) => toggleFlag(key, val)}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={value ? colors.buttonText : "#f4f3f4"}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>

                <View style={{flexDirection: 'row', gap: 10}}>
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
            
            {/* Media Viewer */}
            <View style={styles.contentContainer}>
                {loadingMedia && <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />}
                {media.mediaType === 'VIDEO' ? (
                    <Video
                        style={styles.media}
                        source={{ uri: media.imageUrl }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay
                        onLoadStart={() => setLoadingMedia(true)}
                        onLoad={() => setLoadingMedia(false)}
                    />
                ) : (
                    <Image 
                        source={{ uri: media.imageUrl }} 
                        style={styles.media} 
                        resizeMode="contain"
                    />
                )}
            </View>

            {/* Bottom Info (Hide if settings open) */}
            {!settingsVisible && (media.title || media.description) && (
                <View style={styles.infoBar}>
                    <Text style={styles.title}>{media.title}</Text>
                    {media.description ? <Text style={styles.desc}>{media.description}</Text> : null}
                </View>
            )}

            {/* --- Admin Settings Modal --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={settingsVisible}
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Configuración de Imagen</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView>
                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Usos Especiales</Text>
                            <Text style={{color: colors.textSecondary, marginBottom: 10, fontSize: 12}}>
                                Activar una de estas opciones desactivará la misma opción en otras imágenes.
                            </Text>

                            {renderSwitch("Logo de la App", "imageLogo", media.imageLogo)}
                            {renderSwitch("Pantalla de Inicio (Splash)", "imageStart", media.imageStart)}
                            {renderSwitch("Barra Superior (Top Bar)", "imageTopBar", media.imageTopBar)}
                            {renderSwitch("Sección 'Nosotros'", "imageUs", media.imageUs)}

                            <View style={{height: 1, backgroundColor: colors.border, marginVertical: 15}} />

                            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Visibilidad</Text>
                            {renderSwitch("Mostrar en Galería Pública", "imageGallery", media.imageGallery)}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    contentContainer: { width: width, height: height, justifyContent: 'center' },
    media: { width: '100%', height: '100%' },
    topBar: {
        position: 'absolute', top: 50, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
        zIndex: 10
    },
    iconBtn: {
        padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, marginLeft: 10
    },
    infoBar: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 12
    },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    desc: { color: '#ddd', marginTop: 4, fontSize: 14 },
    
    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { 
        borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, 
        height: '50%', elevation: 10 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', opacity: 0.7 },
    switchRow: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: 15, paddingVertical: 5 
    },
    switchLabel: { fontSize: 16, fontWeight: '500' }
});