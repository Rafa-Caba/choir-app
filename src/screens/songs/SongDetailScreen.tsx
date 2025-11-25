import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av'; // npx expo install expo-av
import { Ionicons } from '@expo/vector-icons';

import { useSongsStore } from '../../store/useSongsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { getPreviewFromRichText } from '../../utils/textUtils';

export const SongDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { songId } = route.params;
    const { songs, removeSong } = useSongsStore();
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    
    const song = songs.find(s => s.id === songId);
    
    // Audio State
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync(); // Cleanup audio on unmount
            }
        };
    }, [sound]);

    const handlePlayPause = async () => {
        if (!song?.audioUrl) return;

        if (sound) {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        } else {
            setIsLoadingAudio(true);
            try {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: song.audioUrl },
                    { shouldPlay: true }
                );
                setSound(newSound);
                setIsPlaying(true);
                
                // Reset state when audio finishes
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        newSound.setPositionAsync(0);
                    }
                });
            } catch (error) {
                Alert.alert("Error", "No se pudo reproducir el audio.");
                console.log(error);
            } finally {
                setIsLoadingAudio(false);
            }
        }
    };

    const handleEdit = () => {
        navigation.navigate('CreateSongScreen', { songToEdit: song });
    };

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Canto",
            "¿Estás seguro? Esta acción es irreversible.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: async () => {
                        if (!song) return;
                        
                        const success = await removeSong(song.id);
                        if (success) navigation.goBack();
                    }
                }
            ]
        );
    };

    if (!song) return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text }}>Canto no encontrado</Text>
        </View>
    );

    const lyrics = getPreviewFromRichText(song.content, 10000); 

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Actions */}
            {isAdmin && (
                <View style={styles.adminBar}>
                    <TouchableOpacity onPress={handleEdit} style={styles.iconBtn}>
                        <Ionicons name="pencil" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                        <Ionicons name="trash" size={24} color="#E91E63" />
                    </TouchableOpacity>
                </View>
            )}

            <Text style={[styles.title, { color: colors.primary }]}>{song.title}</Text>
            
            {song.composer && (
                <Text style={[styles.composer, { color: colors.textSecondary }]}>
                    Por: {song.composer}
                </Text>
            )}

            {/* Audio Player */}
            {song.audioUrl && (
                <View style={[styles.playerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={handlePlayPause} disabled={isLoadingAudio}>
                        {isLoadingAudio ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <Ionicons 
                                name={isPlaying ? "pause-circle" : "play-circle"} 
                                size={50} 
                                color={colors.primary} 
                            />
                        )}
                    </TouchableOpacity>
                    <View style={styles.playerTextContainer}>
                        <Text style={[styles.playerText, { color: colors.text }]}>
                            {isPlaying ? "Reproduciendo..." : "Escuchar Audio"}
                        </Text>
                    </View>
                </View>
            )}
            
            <View style={styles.lyricsContainer}>
                <Text style={[styles.lyrics, { color: colors.text }]}>{lyrics}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    adminBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
    iconBtn: { padding: 8, marginLeft: 10 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    composer: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    
    playerContainer: { 
        flexDirection: 'row', alignItems: 'center', 
        padding: 15, borderRadius: 12, borderWidth: 1, 
        marginBottom: 25, elevation: 2 
    },
    playerTextContainer: { marginLeft: 15 },
    playerText: { fontSize: 16, fontWeight: '600' },
    
    lyricsContainer: { paddingBottom: 50 },
    lyrics: { fontSize: 18, lineHeight: 32, textAlign: 'center' }
});