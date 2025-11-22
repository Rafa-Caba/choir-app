import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { getPreviewFromRichText } from '../../utils/textUtils';

export const SongDetailScreen = () => {
    const route = useRoute<any>();
    const { songId } = route.params;
    const { songs } = useSongsStore();
    
    const song = songs.find(s => s.id === songId);

    if (!song) return <Text>Canto no encontrado</Text>;

    // For now, we use the simple text extractor. 
    // Later you can build a proper Rich Text Renderer component.
    const lyrics = getPreviewFromRichText(song.content, 10000); 

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{song.title}</Text>
            {song.composer && <Text style={styles.composer}>Por: {song.composer}</Text>}
            
            <View style={styles.lyricsContainer}>
                <Text style={styles.lyrics}>{lyrics}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    composer: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    lyricsContainer: { marginTop: 10, paddingBottom: 50 },
    lyrics: { fontSize: 18, lineHeight: 28, textAlign: 'center', color: '#333' }
});