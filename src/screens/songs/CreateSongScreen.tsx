// src/screens/songs/CreateSongScreen.tsx

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import {
    useCreateSongMutation,
    useSongTypesQuery,
    useUpdateSongMutation
} from '../../hooks/query/useSongsData';
import { useTheme } from '../../context/ThemeContext';
import { TypeSelectorModal } from '../../components/song/TypeSelectorModal';
import type { SongsStackParamList } from '../../navigation/SongsNavigator';
import type { SongContent } from '../../types/song';
import type { TipTapNode } from '../../types/blog';

const extractNodeText = (node: TipTapNode): string => {
    if (typeof node.text === 'string') {
        return node.text;
    }

    return (node.content ?? []).map(extractNodeText).join('');
};

const extractSongText = (content: SongContent | undefined): string => {
    if (!content?.content) {
        return '';
    }

    return content.content.map(extractNodeText).join('\n');
};

const buildSongContent = (value: string): SongContent => ({
    type: 'doc',
    content: value.split('\n').map((line) => ({
        type: 'paragraph',
        content: line.length > 0 ? [{ type: 'text', text: line }] : []
    }))
});

export const CreateSongScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SongsStackParamList, 'CreateSongScreen'>>();
    const route = useRoute<RouteProp<SongsStackParamList, 'CreateSongScreen'>>();
    const songToEdit = route.params?.songToEdit;
    const preSelectedTypeId = route.params?.preSelectedTypeId;
    const isEdit = Boolean(songToEdit);
    const songTypesQuery = useSongTypesQuery();
    const createMutation = useCreateSongMutation();
    const updateMutation = useUpdateSongMutation();
    const songTypes = songTypesQuery.data ?? [];
    const colors = useTheme().currentTheme;
    const [title, setTitle] = useState(songToEdit?.title ?? '');
    const [composer, setComposer] = useState(songToEdit?.composer ?? '');
    const [content, setContent] = useState(extractSongText(songToEdit?.content));
    const [selectedType, setSelectedType] = useState<string | null>(
        songToEdit?.songTypeId ?? preSelectedTypeId ?? null
    );
    const [selectedTypeName, setSelectedTypeName] = useState('Selecciona una categoría');
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [audioName, setAudioName] = useState<string | null>(
        songToEdit?.audioUrl ? 'Audio actual' : null
    );
    const submitting = createMutation.isPending || updateMutation.isPending;

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar canto' : 'Nuevo canto' });
    }, [isEdit, navigation]);

    useEffect(() => {
        const selected = songTypes.find((type) => type.id === selectedType);
        setSelectedTypeName(selected?.name ?? 'Selecciona una categoría');
    }, [selectedType, songTypes]);

    const handlePickAudio = async (): Promise<void> => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setAudioUri(asset.uri);
                setAudioName(asset.name);
            }
        } catch {
            Alert.alert('Error', 'No fue posible seleccionar el audio.');
        }
    };

    const handleSubmit = async (): Promise<void> => {
        const normalizedTitle = title.trim();

        if (!normalizedTitle) {
            Alert.alert('Error', 'El título es obligatorio.');
            return;
        }

        if (!selectedType) {
            Alert.alert('Error', 'Selecciona una categoría.');
            return;
        }

        const payload = {
            title: normalizedTitle,
            composer: composer.trim(),
            content: buildSongContent(content),
            songTypeId: selectedType
        };

        try {
            if (songToEdit) {
                await updateMutation.mutateAsync({
                    id: songToEdit.id,
                    payload,
                    audioUri: audioUri ?? undefined
                });
            } else {
                await createMutation.mutateAsync({
                    payload,
                    audioUri: audioUri ?? undefined
                });
            }
            navigation.goBack();
        } catch {
            Alert.alert('Error', 'No fue posible guardar el canto. Intenta nuevamente.');
        }
    };

    const inputStyle = [
        styles.input,
        { backgroundColor: colors.cardColor, color: colors.textColor }
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flexOne, { backgroundColor: colors.backgroundColor }]}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
                <Text style={[styles.label, { color: colors.textColor }]}>Título</Text>
                <TextInput
                    style={inputStyle}
                    value={title}
                    onChangeText={setTitle}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    editable={!submitting}
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Compositor</Text>
                <TextInput
                    style={inputStyle}
                    value={composer}
                    onChangeText={setComposer}
                    autoCorrect
                    spellCheck
                    autoCapitalize="words"
                    editable={!submitting}
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Categoría</Text>
                <TouchableOpacity
                    style={[inputStyle, styles.selectorButton]}
                    onPress={() => setShowTypeModal(true)}
                    disabled={submitting || songTypesQuery.isLoading}
                >
                    <Text style={{ color: selectedType ? colors.textColor : colors.secondaryTextColor }}>
                        {songTypesQuery.isLoading ? 'Cargando categorías...' : selectedTypeName}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.secondaryTextColor} />
                </TouchableOpacity>

                <TypeSelectorModal
                    visible={showTypeModal}
                    onClose={() => setShowTypeModal(false)}
                    allTypes={songTypes}
                    selectedTypeId={selectedType}
                    onSelect={(id, name) => {
                        setSelectedType(id);
                        setSelectedTypeName(name);
                    }}
                />

                <Text style={[styles.label, { color: colors.textColor }]}>Audio</Text>
                <View style={styles.audioRow}>
                    <TouchableOpacity
                        style={[
                            styles.audioButton,
                            {
                                backgroundColor: colors.cardColor,
                                borderColor: colors.primaryColor
                            }
                        ]}
                        onPress={() => void handlePickAudio()}
                        disabled={submitting}
                    >
                        <Ionicons name="musical-note" size={20} color={colors.primaryColor} />
                        <Text style={[styles.audioText, { color: colors.textColor }]} numberOfLines={1}>
                            {audioName ?? 'Selecciona un audio...'}
                        </Text>
                    </TouchableOpacity>
                    {audioUri && (
                        <TouchableOpacity onPress={() => {
                            setAudioUri(null);
                            setAudioName(null);
                        }}>
                            <Ionicons name="close-circle" size={24} color="#E91E63" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.label, { color: colors.textColor }]}>Letra</Text>
                <TextInput
                    style={[inputStyle, styles.textArea]}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    placeholder="Escribe la letra aquí..."
                    placeholderTextColor={colors.secondaryTextColor}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    editable={!submitting}
                />

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.buttonColor }]}
                    onPress={() => void handleSubmit()}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.submitText, { color: colors.buttonTextColor }]}>
                            {isEdit ? 'Actualizar canto' : 'Guardar canto'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    content: { padding: 20, paddingBottom: 60 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    input: { borderRadius: 8, padding: 12, fontSize: 16 },
    selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    textArea: { minHeight: 250 },
    audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    audioButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed'
    },
    audioText: { marginLeft: 10, flex: 1 },
    submitButton: { marginTop: 30, padding: 15, borderRadius: 10, alignItems: 'center' },
    submitText: { fontSize: 18, fontWeight: 'bold' }
});
