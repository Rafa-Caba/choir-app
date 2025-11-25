import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'; // Import Video

import { useAuthStore } from '../../store/useAuthStore';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const MediaDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { currentTheme } = useTheme();
    
    // We expect the whole object in params
    const { media } = route.params; 

    const { user } = useAuthStore();
    const { removeImage } = useGalleryStore();

    const [loadingMedia, setLoadingMedia] = useState(false);
    
    const canDelete = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const handleDelete = () => {
        Alert.alert("Eliminar Archivo", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Eliminar", style: "destructive", 
                onPress: async () => {
                    const success = await removeImage(media.id);
                    if (success) navigation.goBack();
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                {canDelete && (
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(255,0,0,0.5)' }]} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            
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

            {/* Bottom Info */}
            {(media.title || media.description) && (
                <View style={styles.infoBar}>
                    <Text style={styles.title}>{media.title}</Text>
                    {media.description ? <Text style={styles.desc}>{media.description}</Text> : null}
                </View>
            )}
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
        padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50
    },
    infoBar: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 12
    },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    desc: { color: '#ddd', marginTop: 4, fontSize: 14 }
});