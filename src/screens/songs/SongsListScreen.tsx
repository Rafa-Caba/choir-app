import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { getPreviewFromRichText } from '../../utils/textUtils';

export const SongsListScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { typeId, typeName } = route.params; // Params passed from previous screen
    
    const { getSongsByType } = useSongsStore();
    const songs = getSongsByType(typeId);

    return (
        <View style={styles.container}>
            {/* <Text style={styles.title}>{typeName}</Text> */}

            <FlatList
                data={songs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => navigation.navigate('SongDetailScreen', { songId: item.id })}
                    >
                        <Text style={styles.songTitle}>{item.title}</Text>
                        <Text style={styles.preview} numberOfLines={1}>
                            {getPreviewFromRichText(item.content)}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>No hay cantos en esta categoría.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#8B4BFF' },
    card: { backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 8 },
    songTitle: { fontSize: 18, fontWeight: '600' },
    preview: { color: 'gray', marginTop: 5 }
});