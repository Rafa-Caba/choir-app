import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Platform, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChatStore } from '../../store/useChatStore';
import { getPreviewFromRichText } from '../../utils/textUtils';
import { useTheme } from '../../context/ThemeContext';

interface Props {
    onSend: (text: string, imageUri?: string) => void;
}

export const ChatInput = ({ onSend }: Props) => {
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    // Store Access
    const { replyingTo, setReplyingTo } = useChatStore();

    // Theme Access
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const onSubmit = () => {
        if (message.trim().length > 0 || selectedImage) {
            onSend(message, selectedImage || undefined);
            setMessage('');
            setSelectedImage(null);
            if (replyingTo) setReplyingTo(null);
        }
    };

    return (
        <View>
            {/* --- REPLY PREVIEW BAR --- */}
            {replyingTo && (
                <View style={[
                    styles.replyBar, 
                    { backgroundColor: colors.card, borderTopColor: colors.border }
                ]}>
                    <View style={[styles.replyBarLine, { backgroundColor: colors.primary }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.replyBarName, { color: colors.primary }]}>
                            Respondiendo a {replyingTo.author.name.split(' ')[0]}
                        </Text>
                        <Text numberOfLines={1} style={[styles.replyBarText, { color: colors.textSecondary }]}>
                            {getPreviewFromRichText(replyingTo.content)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <Ionicons name="close-circle" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            )}

            {/* --- IMAGE PREVIEW BAR --- */}
            {selectedImage && (
                <View style={[
                    styles.imagePreviewBar, 
                    { backgroundColor: colors.card, borderTopColor: colors.border }
                ]}>
                    <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
                    <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                         <Ionicons name="close-circle" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            )}

            {/* --- INPUT AREA --- */}
            <View style={[styles.container, { backgroundColor: colors.primary }]}>
                <View style={styles.itemInput}>
                    <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                        <Ionicons name="add-circle-outline" size={32} color={colors.buttonText} />
                    </TouchableOpacity>
                    
                    <TextInput 
                        style={[styles.input, { 
                            backgroundColor: currentTheme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
                            color: colors.buttonText 
                        }]}
                        placeholder="Mensaje..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        multiline
                        value={message}
                        onChangeText={setMessage}
                    />

                    <TouchableOpacity 
                        style={styles.iconSend} 
                        onPress={onSubmit}
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                            name="send" 
                            color={colors.buttonText} 
                            size={28} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    itemInput: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        fontSize: 16, 
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        maxHeight: 100,
        marginLeft: 5,
    },
    attachBtn: {
        // paddingBottom: 12,
        marginVertical: 'auto',
        paddingLeft: 5
    },
    iconSend: {
        marginLeft: 10,
        // paddingBottom: 14
        marginVertical: 'auto'
    },
    // Reply Bar Styles
    replyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
    },
    replyBarLine: {
        width: 4,
        height: '100%',
        marginRight: 10,
        borderRadius: 2
    },
    replyBarName: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2
    },
    replyBarText: {
        fontSize: 12
    },
    imagePreviewBar: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    previewThumb: {
        width: 60,
        height: 60,
        borderRadius: 8
    },
    removeImageBtn: {
        marginLeft: 10
    }
});