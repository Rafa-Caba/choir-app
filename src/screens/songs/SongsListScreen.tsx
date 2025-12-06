import React, { useLayoutEffect, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useSongsStore } from '../../store/useSongsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext';

export const SongsListScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { typeId, typeName } = route.params || {};

    const { songs, fetchData } = useSongsStore();
    const { user } = useAuthStore();
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    useEffect(() => {
        if (songs.length === 0) {
            fetchData();
        }
    }, [songs.length, fetchData]);

    const filteredSongs = useMemo(() => {
        if (!typeId && !typeName) return songs;

        return songs.filter((s) => {
            if (typeId) {
                if (!s.songTypeId) return false;
                return s.songTypeId.toString() === typeId.toString();
            }

            if (typeName) {
                return (
                    typeof s.songTypeName === 'string' &&
                    s.songTypeName.toLowerCase() === typeName.toLowerCase()
                );
            }

            return true;
        });
    }, [songs, typeId, typeName]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: typeName || 'Songs',
            headerStyle: { backgroundColor: colors.backgroundColor },
            headerTintColor: colors.textColor,
        });
    }, [navigation, typeName, colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundColor }]}>
            {canEdit && (
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() =>
                        navigation.navigate('CreateSongScreen', { preSelectedTypeId: typeId })
                    }
                >
                    <Text style={[styles.addButtonText, { color: colors.buttonTextColor }]}>
                        + Agregar Canto
                    </Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={filteredSongs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.cardColor,
                                borderColor: colors.borderColor,
                            },
                        ]}
                        onPress={() =>
                            navigation.navigate('SongDetailScreen', { songId: item.id })
                        }
                    >
                        <Text style={[styles.songTitle, { color: colors.textColor }]}>
                            {item.title}
                        </Text>

                        {item.composer ? (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: colors.primaryColor,
                                    fontStyle: 'italic',
                                }}
                            >
                                {item.composer}
                            </Text>
                        ) : null}

                        <Text
                            style={[styles.preview, { color: colors.secondaryTextColor }]}
                            numberOfLines={1}
                        >
                            {getPreviewFromRichText(item.content)}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text
                        style={{
                            color: colors.secondaryTextColor,
                            textAlign: 'center',
                            marginTop: 20,
                        }}
                    >
                        No songs here yet.
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    addButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        elevation: 2,
    },
    songTitle: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
    preview: { marginTop: 5, fontSize: 14 },
});
