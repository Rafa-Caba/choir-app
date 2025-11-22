import React, { useState } from 'react';
// FIX: Added 'Text' to the imports
import { StyleSheet, TextInput, View, TouchableOpacity, Platform, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChatStore } from '../../store/useChatStore';
import { getPreviewFromRichText } from '../../utils/textUtils';

interface Props {
    onSend: (text: string, imageUri?: string) => void;
}

export const ChatInput = ({ onSend }: Props) => {
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Get the reply state and setter from the store
    const { replyingTo, setReplyingTo } = useChatStore();

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
                <View style={styles.replyBar}>
                    <View style={styles.replyBarLine} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.replyBarName}>
                            Respondiendo a {replyingTo.author.name.split(' ')[0]}
                        </Text>
                        <Text numberOfLines={1} style={styles.replyBarText}>
                            {getPreviewFromRichText(replyingTo.content)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}>
                        <Ionicons name="close-circle" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            {selectedImage && (
                <View style={styles.imagePreviewBar}>
                    <Image source={{ uri: selectedImage }} style={styles.previewThumb} />
                    <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                         <Ionicons name="close-circle" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            )}

            {/* --- INPUT AREA --- */}
            <View style={styles.container}>
                <View style={styles.itemInput}>
                    <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                        <Ionicons name="add-circle-outline" size={32} color="#fff" />
                    </TouchableOpacity>
                    
                    <TextInput 
                        style={styles.input}
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
                            color="#fff"
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
        backgroundColor: '#AC75FF',
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
        color: '#fff',
        backgroundColor: '#9d5cff',
        fontSize: 16, 
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        maxHeight: 100,
        marginLeft: 5,
    },
    attachBtn: {
        paddingBottom: 8,
        paddingLeft: 5
    },
    iconSend: {
        marginLeft: 10,
        paddingBottom: 8
    },
    // Reply Bar Styles
    replyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    replyBarLine: {
        width: 4,
        height: '100%',
        backgroundColor: '#AC75FF',
        marginRight: 10,
        borderRadius: 2
    },
    replyBarName: {
        fontWeight: 'bold',
        color: '#AC75FF',
        fontSize: 12,
        marginBottom: 2
    },
    replyBarText: {
        color: '#666',
        fontSize: 12
    },
    imagePreviewBar: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
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