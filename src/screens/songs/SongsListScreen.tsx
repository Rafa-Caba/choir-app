import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { useAuthStore } from '../../store/useAuthStore'; // <--- Import Auth
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext';

export const SongsListScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { typeId, typeName } = route.params;
    
    const { getSongsByType } = useSongsStore();
    const { user } = useAuthStore(); // <--- Get User
    const songs = getSongsByType(typeId);

    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR'; // <--- Check Role

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Title */}
            {/* <Text style={[styles.title, { color: colors.primary }]}>{typeName}</Text> */}

            {/* --- FIX: ADD BUTTON --- */}
            {canEdit && (
                <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: colors.button }]}
                    onPress={() => navigation.navigate('CreateSongScreen', { preSelectedTypeId: typeId })}
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonText }]}>
                        + Agregar Canto
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={songs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.card, { 
                            backgroundColor: colors.card,
                            borderColor: colors.border
                        }]}
                        onPress={() => navigation.navigate('SongDetailScreen', { songId: item.id })}
                    >
                        <Text style={[styles.songTitle, { color: colors.text }]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
                            {getPreviewFromRichText(item.content)}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                        No hay cantos en esta categoría.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 }, // Adjusted margin
    addButton: { 
        padding: 12, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginBottom: 20,
        elevation: 2 
    },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: { 
        padding: 15, 
        marginBottom: 10, 
        borderRadius: 10,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 }
    },
    songTitle: { fontSize: 18, fontWeight: '600' },
    preview: { marginTop: 5, fontSize: 14 }
});