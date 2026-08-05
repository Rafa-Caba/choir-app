// src/screens/blog/CreateBlogScreen.tsx

import React, { useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import type { BlogStackParamList } from '../../navigation/BlogNavigator';
import { getApiErrorMessage } from '../../services/auth';
import {
    useCreateBlogMutation,
    useUpdateBlogMutation
} from '../../hooks/query/useBlogData';
import { getPreviewFromRichText, plainTextToRichText } from '../../utils/textUtils';

export const CreateBlogScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<BlogStackParamList, 'CreateBlog'>>();
    const route = useRoute<RouteProp<BlogStackParamList, 'CreateBlog'>>();
    const postToEdit = route.params?.postToEdit;
    const isEdit = Boolean(postToEdit);
    const colors = useTheme().currentTheme;
    const createMutation = useCreateBlogMutation();
    const updateMutation = useUpdateBlogMutation();
    const [title, setTitle] = useState(postToEdit?.title ?? '');
    const [content, setContent] = useState(
        postToEdit ? getPreviewFromRichText(postToEdit.content, 20_000) : ''
    );
    const [imageUri, setImageUri] = useState<string | null>(
        postToEdit?.cachedImageUrl ?? postToEdit?.imageUrl ?? null
    );
    const [isPublic, setIsPublic] = useState(postToEdit?.isPublic ?? true);
    const [submitting, setSubmitting] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEdit ? 'Editar publicación' : 'Nueva publicación'
        });
    }, [navigation, isEdit]);

    const pickImage = async (): Promise<void> => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async (): Promise<void> => {
        const normalizedTitle = title.trim();
        const normalizedContent = content.trim();

        if (!normalizedTitle || !normalizedContent) {
            Alert.alert('Datos incompletos', 'El título y el contenido son obligatorios.');
            return;
        }

        setSubmitting(true);
        const payload = {
            title: normalizedTitle,
            content: plainTextToRichText(normalizedContent),
            imageUri: imageUri ?? undefined,
            isPublic
        };

        try {
            if (postToEdit) {
                await updateMutation.mutateAsync({ id: postToEdit.id, payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'No fue posible guardar la publicación',
                getApiErrorMessage(error instanceof Error ? error : new Error('Request failed'))
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flexOne, { backgroundColor: colors.backgroundColor }]}
        >
            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
                <TouchableOpacity
                    style={[styles.imagePickerContainer, { backgroundColor: colors.cardColor }]}
                    onPress={() => void pickImage()}
                    activeOpacity={0.8}
                >
                    {imageUri ? (
                        <>
                            <Image source={{ uri: imageUri }} style={styles.coverImage} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setImageUri(null)}
                            >
                                <Ionicons name="close" size={22} color="#ffffff" />
                            </TouchableOpacity>
                            <View style={styles.editImageOverlay}>
                                <Ionicons name="camera" size={24} color="#ffffff" />
                            </View>
                        </>
                    ) : (
                        <>
                            <Ionicons name="image-outline" size={50} color={colors.secondaryTextColor} />
                            <Text style={[styles.placeholderText, { color: colors.secondaryTextColor }]}>
                                Agregar imagen de portada
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.textColor }]}>Título</Text>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: colors.cardColor,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }
                    ]}
                    placeholder="Título de la publicación"
                    placeholderTextColor={colors.secondaryTextColor}
                    value={title}
                    onChangeText={setTitle}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    returnKeyType="next"
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Contenido</Text>
                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        {
                            backgroundColor: colors.cardColor,
                            color: colors.textColor,
                            borderColor: colors.borderColor
                        }
                    ]}
                    placeholder="Escribe el contenido aquí..."
                    placeholderTextColor={colors.secondaryTextColor}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    keyboardType="default"
                />

                <TouchableOpacity
                    style={[styles.switchRow, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}
                    activeOpacity={1}
                >
                    <Text style={[styles.switchLabel, { color: colors.textColor }]}>Publicación visible</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: colors.primaryColor }}
                        thumbColor={isPublic ? colors.buttonTextColor : '#f4f3f4'}
                        onValueChange={setIsPublic}
                        value={isPublic}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: colors.buttonColor },
                        submitting && styles.disabled
                    ]}
                    onPress={() => void handleSubmit()}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.submitText, { color: colors.buttonTextColor }]}>
                            {isEdit ? 'Actualizar publicación' : 'Publicar'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    scrollContent: { paddingBottom: 140 },
    imagePickerContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    coverImage: { width: '100%', height: '100%' },
    placeholderText: { marginTop: 10, fontWeight: '600' },
    editImageOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.65)',
        padding: 8,
        borderRadius: 20
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.65)',
        padding: 6,
        borderRadius: 18
    },
    label: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 18, marginHorizontal: 20 },
    input: { borderWidth: 1, borderRadius: 10, padding: 15, fontSize: 16, marginHorizontal: 20 },
    textArea: { minHeight: 240 },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 25,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1
    },
    switchLabel: { fontSize: 16, fontWeight: '700' },
    submitButton: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', margin: 20 },
    submitText: { fontWeight: '700', fontSize: 17 },
    disabled: { opacity: 0.6 }
});
