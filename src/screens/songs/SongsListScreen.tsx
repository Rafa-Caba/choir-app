// src/screens/songs/SongsListScreen.tsx

import React, { useLayoutEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSongsQuery } from '../../hooks/query/useSongsData';
import { useAuthStore } from '../../store/useAuthStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext';
import type { SongsStackParamList } from '../../navigation/SongsNavigator';

export const SongsListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SongsStackParamList, 'SongsListScreen'>>();
    const route = useRoute<RouteProp<SongsStackParamList, 'SongsListScreen'>>();
    const { typeId, typeName } = route.params;
    const songsQuery = useSongsQuery();
    const songs = songsQuery.data ?? [];
    const user = useAuthStore((state) => state.user);
    const colors = useTheme().currentTheme;
    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const filteredSongs = useMemo(
        () => songs.filter((song) => song.songTypeId === typeId),
        [songs, typeId]
    );

    useLayoutEffect(() => {
        navigation.setOptions({ title: typeName });
    }, [navigation, typeName]);

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            {canEdit && (
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => navigation.navigate('CreateSongScreen', { preSelectedTypeId: typeId })}
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>+ Nuevo canto</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={filteredSongs}
                keyExtractor={(item) => item.id}
                refreshing={songsQuery.isRefetching}
                onRefresh={() => void songsQuery.refetch()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.cardColor,
                                borderColor: colors.borderColor
                            }
                        ]}
                        onPress={() => navigation.navigate('SongDetailScreen', { songId: item.id })}
                    >
                        <Text style={[styles.songTitle, { color: colors.textColor }]}>{item.title}</Text>
                        {item.composer ? (
                            <Text style={[styles.composer, { color: colors.primaryColor }]}>{item.composer}</Text>
                        ) : null}
                        <Text
                            style={[styles.preview, { color: colors.secondaryTextColor }]}
                            numberOfLines={2}
                        >
                            {getPreviewFromRichText(item.content)}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={songsQuery.isLoading ? (
                    <ActivityIndicator color={colors.primaryColor} style={styles.status} />
                ) : songsQuery.isError ? (
                    <View style={styles.status}>
                        <Text style={{ color: colors.secondaryTextColor }}>No fue posible cargar los cantos.</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                            onPress={() => void songsQuery.refetch()}
                        >
                            <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.empty, { color: colors.secondaryTextColor }]}>Aún no hay cantos aquí.</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    addButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, elevation: 2 },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    listContent: { flexGrow: 1, paddingBottom: 20 },
    card: { padding: 15, marginBottom: 10, borderRadius: 10, borderWidth: 1, elevation: 2 },
    songTitle: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
    composer: { fontSize: 12, fontStyle: 'italic' },
    preview: { marginTop: 5, fontSize: 14 },
    empty: { textAlign: 'center', marginTop: 30 },
    status: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }
});
