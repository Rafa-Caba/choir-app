import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { styles as themeStyles } from '../../theme/appTheme';

export const SongTypesScreen = () => {
    const navigation = useNavigation<any>();
    const { songTypes, fetchData, loading } = useSongsStore();

    useEffect(() => {
        fetchData();
    }, []);

    const handlePress = (typeId: number, typeName: string) => {
        navigation.navigate('SongsListScreen', { typeId, typeName });
    };

    return (
        <View style={styles.container}>
            <Text style={themeStyles.title}>Tipos de Cantos</Text>
            
            {/* Show "Add Song" button (Logic for Admin check omitted for brevity) */}
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateSongScreen')}
            >
                <Text style={styles.addButtonText}>+ Agregar Canto</Text>
            </TouchableOpacity>

            <FlatList
                data={songTypes}
                keyExtractor={(item) => item.id.toString()}
                refreshing={loading}
                onRefresh={fetchData}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => handlePress(item.id, item.name)}
                    >
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        {/* <Text style={styles.cardSubtitle}>Orden: {item.order}</Text> */}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    addButton: { backgroundColor: '#8B4BFF', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    addButtonText: { color: 'white', fontWeight: 'bold' },
    card: { backgroundColor: 'white', padding: 20, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardSubtitle: { color: 'gray', fontStyle: 'italic' }
});