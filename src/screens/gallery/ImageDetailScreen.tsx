import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export const ImageDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    
    // Theme Hook
    const { currentTheme } = useTheme();
    
    const { image } = route.params; 

    const { user } = useAuthStore();
    const { removeImage } = useGalleryStore();

    const canDelete = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    const handleDelete = () => {
        Alert.alert(
            "Eliminar Imagen",
            "¿Estás seguro? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: async () => {
                        const success = await removeImage(image.id);
                        if (success) {
                            navigation.goBack();
                        } else {
                            Alert.alert("Error", "No se pudo eliminar");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                {canDelete && (
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(255,0,0,0.5)' }]} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            
            <Image 
                source={{ uri: image.imageUrl }} 
                style={styles.image} 
                resizeMode="contain" 
            />

            {/* Bottom Info */}
            {(image.title || image.description) && (
                <View style={styles.infoBar}>
                    <Text style={styles.title}>{image.title}</Text>
                    {image.description ? <Text style={styles.desc}>{image.description}</Text> : null}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    image: { 
        width: width, 
        height: height 
    },
    topBar: {
        position: 'absolute', 
        top: 50, 
        left: 0, 
        right: 0,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
        zIndex: 10
    },
    iconBtn: {
        paddingBottom: 6, 
        paddingTop: 10, 
        paddingHorizontal: 12, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        borderRadius: 50
    },
    infoBar: {
        position: 'absolute', 
        bottom: 40, 
        left: 20, 
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)', 
        padding: 15, 
        borderRadius: 12
    },
    title: { 
        color: 'white', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    desc: { 
        color: '#ddd', 
        marginTop: 4, 
        fontSize: 14 
    }
});