// src/screens/CreateAnnouncementScreen.tsx

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
import { useTheme } from '../context/ThemeContext';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { getApiErrorMessage } from '../services/auth';
import {
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation
} from '../hooks/query/useAnnouncementData';
import { getPreviewFromRichText, plainTextToRichText } from '../utils/textUtils';

export const CreateAnnouncementScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'CreateAnnouncement'>>();
    const route = useRoute<RouteProp<HomeStackParamList, 'CreateAnnouncement'>>();
    const announcement = route.params?.announcement;
    const isEdit = Boolean(announcement);
    const colors = useTheme().currentTheme;
    const createMutation = useCreateAnnouncementMutation();
    const updateMutation = useUpdateAnnouncementMutation();
    const [title, setTitle] = useState(announcement?.title ?? '');
    const [content, setContent] = useState(
        announcement ? getPreviewFromRichText(announcement.content, 20_000) : ''
    );
    const [imageUri, setImageUri] = useState<string | null>(
        announcement?.cachedImageUrl ?? announcement?.imageUrl ?? null
    );
    const [isPublic, setIsPublic] = useState(announcement?.isPublic ?? true);
    const [loading, setLoading] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar aviso' : 'Nuevo aviso' });
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

        setLoading(true);
        const payload = {
            title: normalizedTitle,
            content: plainTextToRichText(normalizedContent),
            imageUri: imageUri ?? undefined,
            isPublic
        };

        try {
            if (announcement) {
                await updateMutation.mutateAsync({ id: announcement.id, payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'No se pudo guardar el aviso',
                getApiErrorMessage(error instanceof Error ? error : new Error('Request failed'))
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flexOne, { backgroundColor: colors.backgroundColor }]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
                <TouchableOpacity
                    onPress={() => void pickImage()}
                    style={[styles.imagePicker, { backgroundColor: colors.cardColor }]}
                >
                    {imageUri ? (
                        <>
                            <Image source={{ uri: imageUri }} style={styles.image} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setImageUri(null)}
                            >
                                <Ionicons name="close" size={22} color="#ffffff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.center}>
                            <Ionicons name="image-outline" size={40} color={colors.secondaryTextColor} />
                            <Text style={{ color: colors.secondaryTextColor }}>Agregar portada</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.textColor }]}>Título</Text>
                <TextInput
                    style={[styles.input, { color: colors.textColor, borderColor: colors.borderColor }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Título del aviso"
                    placeholderTextColor={colors.secondaryTextColor}
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
                        { color: colors.textColor, borderColor: colors.borderColor }
                    ]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Escribe el aviso aquí..."
                    placeholderTextColor={colors.secondaryTextColor}
                    multiline
                    textAlignVertical="top"
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    keyboardType="default"
                />

                <View style={styles.switchRow}>
                    <Text style={[styles.label, styles.switchLabel, { color: colors.textColor }]}>Público</Text>
                    <Switch
                        value={isPublic}
                        onValueChange={setIsPublic}
                        trackColor={{ false: '#767577', true: colors.primaryColor }}
                        thumbColor={isPublic ? colors.buttonTextColor : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.buttonColor }]}
                    onPress={() => void handleSubmit()}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.buttonTextColor }]}>Guardar aviso</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 140 },
    imagePicker: {
        height: 200,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden'
    },
    center: { alignItems: 'center' },
    image: { width: '100%', height: '100%' },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.65)',
        padding: 6,
        borderRadius: 18
    },
    label: { fontSize: 16, fontWeight: '700', marginBottom: 7 },
    switchLabel: { marginBottom: 0 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
    textArea: { minHeight: 180 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    button: { padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { fontWeight: '700', fontSize: 18 }
});
