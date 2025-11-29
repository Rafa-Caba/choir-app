import React, { useState, useLayoutEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Image, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBlogStore } from '../../store/useBlogStore';
import { useTheme } from '../../context/ThemeContext';

export const CreateBlogScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { postToEdit } = route.params || {};
    const isEdit = !!postToEdit;

    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const { addPost, updatePost } = useBlogStore();

    // Helper: JSON -> Text
    const extractText = (jsonContent: any) => {
        if (!jsonContent) return '';
        try {
            if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
                return jsonContent.content.map((n: any) => n.content?.[0]?.text || '').join('\n');
            }
        } catch (e) { return ''; }
        return '';
    };

    const [title, setTitle] = useState(postToEdit?.title || '');
    const [content, setContent] = useState(isEdit ? extractText(postToEdit.content) : '');
    const [imageUri, setImageUri] = useState<string | null>(postToEdit?.imageUrl || null);
    const [isPublic, setIsPublic] = useState(postToEdit?.isPublic ?? true);
    const [submitting, setSubmitting] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEdit ? 'Edit Post' : 'New Post'
        });
    }, [navigation, isEdit]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Missing Data', 'Title and Content are required.');
            return;
        }

        setSubmitting(true);

        // Convert Text -> TipTap JSON
        const richContent = {
            type: 'doc',
            content: content.split('\n').map((line: string) => ({
                type: 'paragraph',
                content: line.trim() ? [{ type: 'text', text: line }] : []
            }))
        };

        const payload = {
            title,
            content: richContent,
            imageUri: imageUri || undefined,
            isPublic
        };

        let success;
        if (isEdit) {
            success = await updatePost(postToEdit.id, payload);
        } else {
            success = await addPost(payload);
        }

        setSubmitting(false);

        if (success) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Could not save post. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>

                <TouchableOpacity
                    style={[styles.imagePickerContainer, { backgroundColor: colors.cardColor }]}
                    onPress={pickImage}
                    activeOpacity={0.8}
                >
                    {imageUri ? (
                        <>
                            <Image source={{ uri: imageUri }} style={styles.coverImage} />
                            <View style={styles.editImageOverlay}>
                                <Ionicons name="camera" size={24} color="white" />
                            </View>
                        </>
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="image-outline" size={50} color={colors.secondaryTextColor} />
                            <Text style={[styles.placeholderText, { color: colors.secondaryTextColor }]}>
                                Add Cover Image
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.formContainer}>
                    <Text style={[styles.label, { color: colors.textColor }]}>Title</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.cardColor, color: colors.textColor, borderColor: colors.borderColor }]}
                        placeholder="Post Title"
                        placeholderTextColor={colors.secondaryTextColor}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={[styles.label, { color: colors.textColor }]}>Content</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardColor, color: colors.textColor, borderColor: colors.borderColor }]}
                        placeholder="Write your content here..."
                        placeholderTextColor={colors.secondaryTextColor}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />

                    <View style={[styles.switchRow, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                        <View>
                            <Text style={[styles.switchLabel, { color: colors.textColor }]}>Visibility</Text>
                            <Text style={[styles.switchSubLabel, { color: colors.secondaryTextColor }]}>
                                {isPublic ? 'Public (Visible to all)' : 'Draft (Admin only)'}
                            </Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: colors.primaryColor }}
                            thumbColor={isPublic ? colors.buttonTextColor : "#f4f3f4"}
                            onValueChange={setIsPublic}
                            value={isPublic}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: colors.buttonColor }, submitting && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.buttonTextColor} />
                        ) : (
                            <Text style={[styles.submitBtnText, { color: colors.buttonTextColor }]}>
                                {isEdit ? 'Update Post' : 'Publish Post'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    imagePickerContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
    coverImage: { width: '100%', height: '100%' },
    placeholderImage: { alignItems: 'center' },
    placeholderText: { marginTop: 10, fontWeight: '600' },
    editImageOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
    formContainer: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { borderWidth: 1, borderRadius: 10, padding: 15, fontSize: 16 },
    textArea: { height: 250 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 25, padding: 15, borderRadius: 10, borderWidth: 1 },
    switchLabel: { fontSize: 16, fontWeight: 'bold' },
    switchSubLabel: { fontSize: 13, marginTop: 2 },
    submitBtn: { paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 2 },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { fontSize: 18, fontWeight: 'bold' }
});