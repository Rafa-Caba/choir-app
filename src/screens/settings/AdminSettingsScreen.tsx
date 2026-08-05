// src/screens/settings/AdminSettingsScreen.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSettings, updateSettings } from '../../services/admin/settings';
import { plainTextToTiptap, tiptapToPlainText } from '../../utils/tiptapUtils';

export const AdminSettingsScreen = () => {
    const colors = useTheme().currentTheme;
    const [loading, setLoading] = useState(false);
    const [appTitle, setAppTitle] = useState('');
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [contactPhone, setContactPhone] = useState('');
    const [legendMain, setLegendMain] = useState('');
    const [legendSec, setLegendSec] = useState('');
    const [historyText, setHistoryText] = useState('');
    const [facebook, setFacebook] = useState('');
    const [instagram, setInstagram] = useState('');
    const [youtube, setYoutube] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');

    const loadData = useCallback(async (): Promise<void> => {
        setLoading(true);

        try {
            const data = await getSettings();
            setAppTitle(data.webTitle || '');
            setContactPhone(data.contactPhone || '');
            setLogoUri(data.logoUrl || null);
            setLegendMain(data.homeLegends?.principal || '');
            setLegendSec(data.homeLegends?.secondary || '');
            setFacebook(data.socials?.facebook || '');
            setInstagram(data.socials?.instagram || '');
            setYoutube(data.socials?.youtube || '');
            setWhatsapp(data.socials?.whatsapp || '');
            setEmail(data.socials?.email || '');
            setHistoryText(tiptapToPlainText(data.history));
        } catch {
            Alert.alert('Error', 'No fue posible cargar la configuración.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const pickImage = async (): Promise<void> => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8
        });

        if (!result.canceled) {
            setLogoUri(result.assets[0].uri);
        }
    };

    const handleSave = async (): Promise<void> => {
        setLoading(true);

        try {
            await updateSettings(
                {
                    webTitle: appTitle,
                    contactPhone,
                    homeLegends: {
                        principal: legendMain,
                        secondary: legendSec
                    },
                    history: plainTextToTiptap(historyText),
                    socials: {
                        facebook,
                        instagram,
                        youtube,
                        whatsapp,
                        email
                    }
                },
                logoUri || undefined
            );
            Alert.alert('Listo', 'La configuración se actualizó correctamente.');
        } catch {
            Alert.alert('Error', 'No fue posible actualizar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = useMemo(() => [
        styles.input,
        {
            backgroundColor: colors.cardColor,
            color: colors.textColor,
            borderColor: colors.borderColor
        }
    ], [colors.backgroundColor, colors.borderColor, colors.cardColor, colors.textColor]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flexOne, { backgroundColor: colors.backgroundColor }]}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Identidad</Text>

                    <View style={styles.logoSection}>
                        <TouchableOpacity onPress={() => void pickImage()} style={styles.logoContainer}>
                            {logoUri ? (
                                <Image source={{ uri: logoUri }} style={styles.logo} />
                            ) : (
                                <View style={[styles.placeholder, { borderColor: colors.borderColor }]}> 
                                    <Ionicons name="image" size={40} color={colors.secondaryTextColor} />
                                </View>
                            )}
                            <View style={[styles.editBadge, { backgroundColor: colors.primaryColor }]}> 
                                <Ionicons name="pencil" size={12} color="#ffffff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.helperText, { color: colors.secondaryTextColor }]}> 
                            Toca para cambiar el logo
                        </Text>
                    </View>

                    <Text style={[styles.label, { color: colors.textColor }]}>Nombre de la app</Text>
                    <TextInput style={inputStyle} value={appTitle} onChangeText={setAppTitle} />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Textos de inicio</Text>

                    <Text style={[styles.label, { color: colors.textColor }]}>Leyenda principal</Text>
                    <TextInput
                        style={inputStyle}
                        value={legendMain}
                        onChangeText={setLegendMain}
                        placeholder="Ej. Bienvenidos..."
                        placeholderTextColor={colors.secondaryTextColor}
                    />

                    <Text style={[styles.label, { color: colors.textColor }]}>Leyenda secundaria</Text>
                    <TextInput
                        style={inputStyle}
                        value={legendSec}
                        onChangeText={setLegendSec}
                        placeholder="Ej. Un espacio de fe y música..."
                        placeholderTextColor={colors.secondaryTextColor}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Historia / Nosotros</Text>
                    <TextInput
                        style={[inputStyle, styles.historyInput]}
                        value={historyText}
                        onChangeText={setHistoryText}
                        multiline
                        placeholder="Escribe la historia del coro..."
                        placeholderTextColor={colors.secondaryTextColor}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Contacto y redes</Text>

                    <View style={styles.rowItem}>
                        <Ionicons name="call" size={20} color={colors.textColor} style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={contactPhone}
                            onChangeText={setContactPhone}
                            placeholder="Teléfono"
                            placeholderTextColor={colors.secondaryTextColor}
                        />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="mail" size={20} color={colors.textColor} style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Correo"
                            placeholderTextColor={colors.secondaryTextColor}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            placeholder="WhatsApp (enlace o número)"
                            placeholderTextColor={colors.secondaryTextColor}
                        />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={facebook}
                            onChangeText={setFacebook}
                            placeholder="URL de Facebook"
                            placeholderTextColor={colors.secondaryTextColor}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-instagram" size={20} color="#C13584" style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={instagram}
                            onChangeText={setInstagram}
                            placeholder="URL de Instagram"
                            placeholderTextColor={colors.secondaryTextColor}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-youtube" size={20} color="#FF0000" style={styles.rowIcon} />
                        <TextInput
                            style={[inputStyle, styles.rowInput]}
                            value={youtube}
                            onChangeText={setYoutube}
                            placeholder="URL de YouTube"
                            placeholderTextColor={colors.secondaryTextColor}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={() => void handleSave()}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>Guardar cambios</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    container: { padding: 20, paddingBottom: 50 },
    section: { marginBottom: 30 },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        paddingBottom: 5
    },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
    logoSection: { alignItems: 'center', marginBottom: 15 },
    logoContainer: { position: 'relative' },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
        resizeMode: 'contain',
        backgroundColor: '#f0f0f0'
    },
    placeholder: {
        width: 100,
        height: 100,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    helperText: { fontSize: 12, marginTop: 5 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 10
    },
    historyInput: { height: 120, textAlignVertical: 'top' },
    rowItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rowIcon: { width: 30, textAlign: 'center', marginRight: 10 },
    rowInput: { flex: 1 },
    saveBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3
    },
    saveText: { fontWeight: 'bold', fontSize: 16 }
});
