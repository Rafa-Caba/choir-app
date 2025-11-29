import React, { useState, useRef } from 'react';
import {
    Modal, View, StyleSheet, TouchableOpacity, Text, Dimensions,
    ActivityIndicator, Platform, Image, ScrollView, TouchableWithoutFeedback, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    mediaUrl: string | null;
    mediaType: 'image' | 'video'; // normalized type
}

export const MediaViewerModal = ({ visible, onClose, mediaUrl, mediaType }: Props) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const [loading, setLoading] = useState(false);
    const [scale, setScale] = useState(1);
    const lastTap = useRef<number | null>(null);

    if (!mediaUrl) return null;

    // --- HANDLE ZOOM (Double Tap) ---
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
            setScale(scale > 1 ? 1 : 2);
        } else {
            lastTap.current = now;
        }
    };

    // --- HANDLE DOWNLOAD ---
    const handleDownload = async () => {
        try {
            setLoading(true);
            const filename = mediaUrl.split('/').pop() || `download.${mediaType === 'video' ? 'mp4' : 'jpg'}`;

            if (Platform.OS === 'web') {
                // 🌍 WEB DOWNLOAD
                const link = document.createElement('a');
                link.href = mediaUrl;
                link.download = filename;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setLoading(false);
            } else {
                // 📱 MOBILE DOWNLOAD
                const fileUri = FileSystem.documentDirectory + filename;
                const { uri } = await FileSystem.downloadAsync(mediaUrl, fileUri);

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                } else {
                    Alert.alert("Descarga completa", "Archivo guardado en documentos.");
                }
                setLoading(false);
            }
        } catch (error) {
            console.error("Download error:", error);
            setLoading(false);
            Alert.alert("Error", "No se pudo descargar el archivo.");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.container}>

                {/* --- Top Bar (Close & Download) --- */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Ionicons name="download-outline" size={24} color="white" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* --- Content --- */}
                <View style={styles.content}>
                    {mediaType === 'video' ? (
                        <Video
                            style={styles.media}
                            source={{ uri: mediaUrl }}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping
                            shouldPlay
                            onError={(e) => console.log("Video Error:", e)}
                        />
                    ) : (
                        // Zoomable Image
                        <ScrollView
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                            maximumZoomScale={3}
                            minimumZoomScale={1}
                            centerContent
                            scrollEnabled={scale > 1}
                        >
                            <TouchableWithoutFeedback onPress={handleDoubleTap}>
                                <Image
                                    source={{ uri: mediaUrl }}
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
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    topBar: {
        position: 'absolute', top: 50, left: 20, right: 20,
        flexDirection: 'row', justifyContent: 'space-between', zIndex: 10
    },
    iconBtn: {
        padding: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20
    },
    content: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
    media: { width: '100%', height: '100%' }
});