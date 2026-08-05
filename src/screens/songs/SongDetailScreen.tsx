// src/screens/songs/SongDetailScreen.tsx

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {
    useDeleteSongMutation,
    useSongsQuery
} from '../../hooks/query/useSongsData';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { RichTextViewer } from '../../components/common/RichTextViewer';
import type { SongsStackParamList } from '../../navigation/SongsNavigator';

export const SongDetailScreen = () => {
    const route = useRoute<RouteProp<SongsStackParamList, 'SongDetailScreen'>>();
    const navigation = useNavigation<NativeStackNavigationProp<SongsStackParamList, 'SongDetailScreen'>>();
    const songsQuery = useSongsQuery();
    const deleteMutation = useDeleteSongMutation();
    const user = useAuthStore((state) => state.user);
    const colors = useTheme().currentTheme;
    const song = (songsQuery.data ?? []).find((item) => item.id === route.params.songId);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerStyle: { backgroundColor: colors.backgroundColor },
            headerTintColor: colors.textColor,
            title: 'Detalle del canto'
        });
    }, [colors.backgroundColor, colors.textColor, navigation]);

    useEffect(() => () => {
        if (sound) {
            void sound.unloadAsync();
        }
    }, [sound]);

    const handlePlayPause = async (): Promise<void> => {
        const audioSource = song?.cachedAudioUrl ?? song?.audioUrl;

        if (!audioSource) {
            return;
        }

        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            setIsLoadingAudio(true);
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const result = await Audio.Sound.createAsync(
                { uri: audioSource },
                { shouldPlay: true }
            );
            setSound(result.sound);
            setIsPlaying(true);
            result.sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    void result.sound.setPositionAsync(0);
                }
            });
        } catch {
            Alert.alert('Error', 'No se pudo reproducir el audio.');
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const handleDelete = (): void => {
        if (!song) {
            return;
        }

        Alert.alert('Eliminar canto', '¿Estás seguro? Esta acción es irreversible.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                    deleteMutation.mutate(song.id, {
                        onSuccess: () => navigation.goBack(),
                        onError: () => Alert.alert('Error', 'No fue posible eliminar el canto.')
                    });
                }
            }
        ]);
    };

    if (songsQuery.isLoading && !song) {
        return (
            <View style={[styles.center, { backgroundColor: colors.backgroundColor }]}>
                <ActivityIndicator color={colors.primaryColor} />
            </View>
        );
    }

    if (!song) {
        return (
            <View style={[styles.center, { backgroundColor: colors.backgroundColor }]}>
                <Text style={{ color: colors.textColor }}>Canto no encontrado.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            {isAdmin && (
                <View style={styles.adminBar}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateSongScreen', { songToEdit: song })}
                        style={styles.iconButton}
                    >
                        <Ionicons name="pencil" size={24} color={colors.primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                        {deleteMutation.isPending ? (
                            <ActivityIndicator color="#E91E63" />
                        ) : (
                            <Ionicons name="trash" size={24} color="#E91E63" />
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <Text style={[styles.title, { color: colors.textColor }]}>{song.title}</Text>
            {song.composer ? (
                <Text style={[styles.composer, { color: colors.secondaryTextColor }]}>Por: {song.composer}</Text>
            ) : null}

            {(song.cachedAudioUrl || song.audioUrl) && (
                <View
                    style={[
                        styles.playerContainer,
                        { backgroundColor: colors.cardColor, borderColor: colors.borderColor }
                    ]}
                >
                    <TouchableOpacity onPress={() => void handlePlayPause()} disabled={isLoadingAudio}>
                        {isLoadingAudio ? (
                            <ActivityIndicator color={colors.primaryColor} />
                        ) : (
                            <Ionicons
                                name={isPlaying ? 'pause-circle' : 'play-circle'}
                                size={50}
                                color={colors.primaryColor}
                            />
                        )}
                    </TouchableOpacity>
                    <View style={styles.playerTextContainer}>
                        <Text style={[styles.playerText, { color: colors.textColor }]}>
                            {isPlaying ? 'Reproduciendo...' : 'Escuchar audio'}
                        </Text>
                        <Text style={{ color: colors.secondaryTextColor, fontSize: 12 }}>
                            {isLoadingAudio ? 'Cargando...' : 'Toca para iniciar'}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.lyricsContainer}>
                <RichTextViewer content={song.content} tight />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    adminBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
    iconButton: { padding: 8, marginLeft: 10 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    composer: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 25,
        elevation: 2
    },
    playerTextContainer: { marginLeft: 15 },
    playerText: { fontSize: 16, fontWeight: '600' },
    lyricsContainer: { marginTop: 20, marginBottom: 50 }
});
