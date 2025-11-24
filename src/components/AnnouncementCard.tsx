import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, Image } from 'react-native';
import type { Announcement } from '../types/announcement';
import { useTheme } from '../context/ThemeContext';

interface Props {
    announcement: Announcement;
    onPress: () => void;
}

export const AnnouncementCard = ({ announcement, onPress }: Props) => {
    // Get the current theme colors
    const { currentTheme } = useTheme();
    
    // Helper to extract plain text from Tiptap JSON
    const getPreviewText = (json: any) => {
        try {
            if (!json?.content) return '';
            // Grab the first paragraph's text
            const paragraph = json.content.find((n: any) => n.type === 'paragraph');
            return paragraph?.content?.[0]?.text || 'Ver detalles...';
        } catch {
            return 'Ver detalles...';
        }
    };

    const date = new Date(announcement.createdAt).toLocaleDateString();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: currentTheme.colors.card }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {announcement.imageUrl && (
                <Image source={{ uri: announcement.imageUrl }} style={styles.image} />
            )}
            
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: currentTheme.colors.text }]}>{announcement.title}</Text>
                    <Text style={styles.date}>{date}</Text>
                </View>
                
                <Text style={styles.preview} numberOfLines={2}>
                    {getPreviewText(announcement.content)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: 150,
    },
    content: {
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    date: {
        fontSize: 12,
        color: '#888',
        marginLeft: 10
    },
    preview: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20
    }
});