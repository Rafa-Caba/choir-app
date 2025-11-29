import React, { useState, useRef } from 'react';
import {
    View, Image, TouchableOpacity, StyleSheet, Text,
    Alert, ActivityIndicator, Modal, Switch, ScrollView, Platform,
    TouchableWithoutFeedback
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useAuthStore } from '../../store/useAuthStore';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useTheme } from '../../context/ThemeContext';

export const MediaDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const [media, setMedia] = useState(route.params.media);
    const { user } = useAuthStore();
    const { removeImage, setFlags } = useGalleryStore();

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
                    Alert.alert("Download Complete", "File saved.");
                }
            }
        } catch (e) {
            Alert.alert("Error", "Download failed.");
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Delete this file?")) {
                removeImage(media.id);
                navigation.goBack();
            }
        } else {
            Alert.alert("Delete", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        await removeImage(media.id);
                        navigation.goBack();
                    }
                }
            ]);
        }
    };

    const toggleFlag = async (key: string, value: boolean) => {
        const updatedMedia = { ...media, [key]: value };
        setMedia(updatedMedia);
        await setFlags(media.id, { [key]: value });
    };

    const renderSwitch = (label: string, key: string, value: boolean) => (
        <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textColor }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={(val) => toggleFlag(key, val)}
                trackColor={{ false: "#767577", true: colors.primaryColor }}
                thumbColor={value ? colors.buttonTextColor : "#f4f3f4"}
            />
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
                        source={{ uri: media.imageUrl }}
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
                                source={{ uri: media.imageUrl }}
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
                    <View style={[styles.modalContent, { backgroundColor: colors.cardColor }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textColor }]}>Image Settings</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textColor} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Usage Flags</Text>
                            {renderSwitch("App Logo", "imageLogo", media.imageLogo)}
                            {renderSwitch("Splash Screen", "imageStart", media.imageStart)}
                            {renderSwitch("Top Bar", "imageTopBar", media.imageTopBar)}
                            {renderSwitch("About Us Section", "imageUs", media.imageUs)}

                            <View style={{ height: 1, backgroundColor: colors.borderColor, marginVertical: 15 }} />

                            <Text style={[styles.sectionTitle, { color: colors.primaryColor }]}>Visibility</Text>
                            {renderSwitch("Show in Public Gallery", "imageGallery", media.imageGallery)}
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
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '50%', elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', opacity: 0.7 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
    switchLabel: { fontSize: 16, fontWeight: '500' }
});