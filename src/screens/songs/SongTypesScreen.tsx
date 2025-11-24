import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSongsStore } from '../../store/useSongsStore';
import { useTheme } from '../../context/ThemeContext'; // 1. Import Theme

export const SongTypesScreen = () => {
    const navigation = useNavigation<any>();
    const { songTypes, fetchData, loading } = useSongsStore();
    
    // 2. Get Theme Colors
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    useEffect(() => {
        fetchData();
    }, []);

    const handlePress = (typeId: number, typeName: string) => {
        navigation.navigate('SongsListScreen', { typeId, typeName });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Dynamic Title Color */}
            <Text style={[styles.title, { color: colors.text }]}>Tipos de Cantos</Text>
            
            <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.button }]}
                onPress={() => navigation.navigate('CreateSongScreen')}
            >
                <Text style={[styles.addButtonText, { color: colors.buttonText }]}>
                    + Agregar Canto
                </Text>
            </TouchableOpacity>

            <FlatList
                data={songTypes}
                keyExtractor={(item) => item.id.toString()}
                refreshing={loading}
                onRefresh={fetchData}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.card, { 
                            backgroundColor: colors.card, 
                            borderColor: colors.border 
                        }]}
                        onPress={() => handlePress(item.id, item.name)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            {item.name}
                        </Text>
                        {/* Optional: Add subtitle styling if needed */}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { 
        fontSize: 28, 
        marginBottom: 15, 
        fontWeight: 'bold', 
        textAlign: 'center' 
    },
    addButton: { 
        padding: 12, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginBottom: 20,
        elevation: 2 
    },
    addButtonText: { fontWeight: 'bold', fontSize: 16 },
    card: { 
        padding: 20, 
        marginBottom: 10, 
        borderRadius: 12, 
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 }
    },
    cardTitle: { fontSize: 18, fontWeight: '600' }
});