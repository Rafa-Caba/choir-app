// src/components/chatMessages/MessageDetailsModal.tsx

import React from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatMessageDetailsQuery } from '../../hooks/query/useChatData';
import type {
    ChatMessage,
    MessageRecipientDetail,
    MessageRecipientStatus
} from '../../types/chat';
import { useTheme } from '../../context/ThemeContext';
import { getPreviewFromRichText } from '../../utils/textUtils';

interface Props {
    readonly visible: boolean;
    readonly message: ChatMessage;
    readonly onClose: () => void;
}

const getMessagePreview = (message: ChatMessage): string => {
    const text = getPreviewFromRichText(message.content).trim();

    if (text) {
        return text;
    }

    switch (message.type) {
        case 'IMAGE':
            return '📷 Foto';
        case 'VIDEO':
        case 'MEDIA':
            return '🎥 Video';
        case 'AUDIO':
            return '🎤 Nota de voz';
        case 'FILE':
            return message.filename ? `📎 ${message.filename}` : '📎 Archivo';
        case 'STICKER':
            return '✨ Sticker';
        case 'REACTION':
            return 'Reacción';
        case 'TEXT':
            return 'Mensaje';
    }
};

const formatReceiptDate = (value: string | null): string => {
    if (!value) {
        return 'Hora no disponible';
    }

    return new Date(value).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusTitle = (status: MessageRecipientStatus): string => {
    switch (status) {
        case 'READ':
            return 'Leído por';
        case 'DELIVERED':
            return 'Entregado a';
        case 'PENDING':
            return 'Pendiente';
    }
};

const getStatusIcon = (
    status: MessageRecipientStatus
): keyof typeof Ionicons.glyphMap => {
    switch (status) {
        case 'READ':
            return 'checkmark-done';
        case 'DELIVERED':
            return 'checkmark-done-outline';
        case 'PENDING':
            return 'time-outline';
    }
};

const getReceiptTime = (detail: MessageRecipientDetail): string => {
    if (detail.status === 'READ') {
        return formatReceiptDate(detail.readAt);
    }

    if (detail.status === 'DELIVERED') {
        return formatReceiptDate(detail.deliveredAt);
    }

    return 'Aún no entregado';
};

export const MessageDetailsModal = ({ visible, message, onClose }: Props) => {
    const colors = useTheme().currentTheme;
    const detailsQuery = useChatMessageDetailsQuery(message.id, visible);
    const details = detailsQuery.data;
    const sections: readonly MessageRecipientStatus[] = [
        'READ',
        'DELIVERED',
        'PENDING'
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modal, { backgroundColor: colors.cardColor }]}>
                            <View style={styles.header}>
                                <View style={styles.flexOne}>
                                    <Text style={[styles.title, { color: colors.textColor }]}>Detalles del mensaje</Text>
                                    <Text
                                        numberOfLines={2}
                                        style={[styles.preview, { color: colors.secondaryTextColor }]}
                                    >
                                        {getMessagePreview(message)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.closeButton}
                                    accessibilityLabel="Cerrar detalles"
                                >
                                    <Ionicons name="close" size={26} color={colors.textColor} />
                                </TouchableOpacity>
                            </View>

                            {detailsQuery.isLoading ? (
                                <View style={styles.statusContainer}>
                                    <ActivityIndicator color={colors.primaryColor} />
                                    <Text style={[styles.statusText, { color: colors.secondaryTextColor }]}>Cargando detalles...</Text>
                                </View>
                            ) : detailsQuery.isError || !details ? (
                                <View style={styles.statusContainer}>
                                    <Text style={[styles.statusText, { color: colors.secondaryTextColor }]}>No fue posible cargar los detalles.</Text>
                                    <TouchableOpacity
                                        style={[styles.retryButton, { backgroundColor: colors.buttonColor }]}
                                        onPress={() => void detailsQuery.refetch()}
                                    >
                                        <Text style={{ color: colors.buttonTextColor, fontWeight: '700' }}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.scrollContent}
                                >
                                    <View style={[styles.summary, { backgroundColor: colors.backgroundColor }]}>
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryNumber, { color: colors.primaryColor }]}>{details.readCount}</Text>
                                            <Text style={[styles.summaryLabel, { color: colors.secondaryTextColor }]}>Leídos</Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryNumber, { color: colors.textColor }]}>{details.deliveredCount}</Text>
                                            <Text style={[styles.summaryLabel, { color: colors.secondaryTextColor }]}>Entregados</Text>
                                        </View>
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryNumber, { color: colors.textColor }]}>{details.recipientCount}</Text>
                                            <Text style={[styles.summaryLabel, { color: colors.secondaryTextColor }]}>Miembros</Text>
                                        </View>
                                    </View>

                                    {sections.map((status) => {
                                        const recipients = details.recipients.filter(
                                            (recipient) => recipient.status === status
                                        );

                                        if (recipients.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <View key={status} style={styles.section}>
                                                <View style={styles.sectionHeader}>
                                                    <Ionicons
                                                        name={getStatusIcon(status)}
                                                        size={19}
                                                        color={status === 'READ'
                                                            ? colors.accentColor
                                                            : colors.secondaryTextColor}
                                                    />
                                                    <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
                                                        {getStatusTitle(status)} ({recipients.length})
                                                    </Text>
                                                </View>

                                                {recipients.map((recipient, index) => (
                                                    <View
                                                        key={recipient.user.id}
                                                        style={[
                                                            styles.recipientRow,
                                                            index < recipients.length - 1
                                                                ? { borderBottomColor: colors.borderColor, borderBottomWidth: 1 }
                                                                : undefined
                                                        ]}
                                                    >
                                                        {recipient.user.imageUrl ? (
                                                            <Image
                                                                source={{ uri: recipient.user.imageUrl }}
                                                                style={styles.avatar}
                                                            />
                                                        ) : (
                                                            <View style={[styles.avatarFallback, { backgroundColor: colors.backgroundColor }]}>
                                                                <Text style={[styles.avatarText, { color: colors.textColor }]}>
                                                                    {recipient.user.name.slice(0, 2).toUpperCase()}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        <View style={styles.flexOne}>
                                                            <Text style={[styles.recipientName, { color: colors.textColor }]} numberOfLines={1}>
                                                                {recipient.user.name}
                                                            </Text>
                                                            <Text style={[styles.receiptTime, { color: colors.secondaryTextColor }]}>
                                                                {getReceiptTime(recipient)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 22,
        backgroundColor: 'rgba(0,0,0,0.48)'
    },
    modal: {
        maxHeight: '78%',
        borderRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    title: { fontSize: 21, fontWeight: '800' },
    preview: { fontSize: 13, marginTop: 5, marginRight: 12 },
    closeButton: { padding: 4 },
    statusContainer: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
    statusText: { marginTop: 10, textAlign: 'center' },
    retryButton: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    scrollContent: { paddingBottom: 8 },
    summary: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: 14,
        marginBottom: 18
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryNumber: { fontSize: 22, fontWeight: '800' },
    summaryLabel: { fontSize: 12, marginTop: 2 },
    section: { marginBottom: 18 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginLeft: 7 },
    recipientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: { fontSize: 13, fontWeight: '800' },
    recipientName: { fontSize: 16, fontWeight: '700' },
    receiptTime: { fontSize: 12, marginTop: 3 }
});
