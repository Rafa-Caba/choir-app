import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext'; // 1. Import Theme

export const SongDetailScreen = () => {
    const route = useRoute<any>();
    const { songId } = route.params;
    const { songs } = useSongsStore();
    
    // 2. Get Theme Colors
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;
    
    const song = songs.find(s => s.id === songId);

    if (!song) return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.text }}>Canto no encontrado</Text>
        </View>
    );

    const lyrics = getPreviewFromRichText(song.content, 10000); 

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.primary }]}>
                {song.title}
            </Text>
            
            {song.composer && (
                <Text style={[styles.composer, { color: colors.textSecondary }]}>
                    Por: {song.composer}
                </Text>
            )}
            
            <View style={styles.lyricsContainer}>
                <Text style={[styles.lyrics, { color: colors.text }]}>
                    {lyrics}
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    composer: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    lyricsContainer: { marginTop: 10, paddingBottom: 50 },
    lyrics: { fontSize: 18, lineHeight: 32, textAlign: 'center' }
});