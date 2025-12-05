import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Announcement } from '../types/announcement';
import { getPreviewFromRichText } from '../utils/textUtils';
import { useTheme } from '../context/ThemeContext';
import { MediaViewerModal } from './shared/MediaViewerModal';
import { RichTextViewer } from './common/RichTextViewer';


interface Props {
    announcement: Announcement;
    onPress?: () => void; // For editing
    onDelete?: () => void; // For admin delete
}

export const AnnouncementCard = ({ announcement, onPress, onDelete }: Props) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;
    const [showModal, setShowModal] = useState(false);

    const dateStr = new Date(announcement.createdAt).toLocaleDateString();
    // const preview = getPreviewFromRichText(announcement.content, 150);

    return (
        <View style={[styles.container, { backgroundColor: colors.cardColor }]}>

            {/* 🆕 Image Viewer Modal */}
            <MediaViewerModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                mediaUrl={announcement.imageUrl || null}
                mediaType="image"
            />

            {announcement.imageUrl && (
                <TouchableOpacity onPress={() => setShowModal(true)}>
                    <Image source={{ uri: announcement.imageUrl }} style={styles.image} />
                </TouchableOpacity>
            )}

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: colors.textColor }]}>
                        {announcement.title}
                    </Text>
                    <Text style={[styles.date, { color: colors.secondaryTextColor }]}>
                        {dateStr}
                    </Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <RichTextViewer content={announcement.content} tight />
                </View>

                {/* Admin Actions */}
                {(onPress || onDelete) && (
                    <View style={[styles.actionsContainer, { borderTopColor: colors.borderColor }]}>
                        <Ionicons style={styles.earthIcon} name="earth" size={20} color={announcement.isPublic ? colors.primaryColor : colors.secondaryTextColor} />
                        <View style={[styles.actions]}>
                            {onPress && (
                                <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
                                    <Ionicons name="pencil" size={20} color={colors.primaryColor} />
                                    <Text style={{ color: colors.primaryColor, marginLeft: 5 }}>Editar</Text>
                                </TouchableOpacity>
                            )}
                            {onDelete && (
                                <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { marginLeft: 20 }]}>
                                    <Ionicons name="trash-outline" size={20} color="#E91E63" />
                                    <Text style={{ color: '#E91E63', marginLeft: 5 }}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    image: { width: '100%', height: 180 },
    content: { padding: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    title: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    date: { fontSize: 12, marginLeft: 10 },
    body: { fontSize: 14, lineHeight: 20 },
    actionsContainer: { flexDirection: 'row', borderTopWidth: 1, marginTop: 15, paddingTop: 10 },
    earthIcon: { alignSelf: 'flex-start', marginRight: 'auto' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
});