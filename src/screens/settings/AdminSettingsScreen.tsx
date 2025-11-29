import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSettings, updateSettings } from '../../services/admin/settings';

export const AdminSettingsScreen = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    const [loading, setLoading] = useState(false);

    // --- General ---
    const [appTitle, setAppTitle] = useState('');
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [contactPhone, setContactPhone] = useState('');

    // --- Legends ---
    const [legendMain, setLegendMain] = useState('');
    const [legendSec, setLegendSec] = useState('');

    // --- History (Rich Text Logic) ---
    const [historyText, setHistoryText] = useState('');

    // --- Socials ---
    const [facebook, setFacebook] = useState('');
    const [instagram, setInstagram] = useState('');
    const [youtube, setYoutube] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    // --- Helper: Extract Plain Text from TipTap ---
    const extractTextFromTiptap = (jsonContent: any) => {
        if (!jsonContent) return '';
        try {
            if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
                return jsonContent.content
                    .map((node: any) => {
                        if (node.content) {
                            return node.content.map((t: any) => t.text).join('');
                        }
                        return '';
                    })
                    .join('\n');
            }
        } catch (e) { return ''; }
        return '';
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setAppTitle(data.webTitle || '');
            setContactPhone(data.contactPhone || '');
            setLogoUri(data.logoUrl || null);

            if (data.homeLegends) {
                setLegendMain(data.homeLegends.principal || '');
                setLegendSec(data.homeLegends.secondary || '');
            }

            if (data.socials) {
                setFacebook(data.socials.facebook || '');
                setInstagram(data.socials.instagram || '');
                setYoutube(data.socials.youtube || '');
                setWhatsapp(data.socials.whatsapp || '');
                setEmail(data.socials.email || '');
            }

            // Parse History
            setHistoryText(extractTextFromTiptap(data.history));

        } catch (e) {
            Alert.alert("Error", "Could not load settings.");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setLogoUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        setLoading(true);

        // Convert History Plain Text -> TipTap JSON
        const historyJson = {
            type: 'doc',
            content: historyText.split('\n').map((line: string) => ({
                type: 'paragraph',
                content: line.trim() ? [{ type: 'text', text: line }] : []
            }))
        };

        const payload = {
            webTitle: appTitle,
            contactPhone,
            homeLegends: {
                principal: legendMain,
                secondary: legendSec
            },
            history: historyJson,
            socials: {
                facebook,
                instagram,
                youtube,
                whatsapp,
                email // English key
            }
        };

        try {
            await updateSettings(payload, logoUri || undefined);
            Alert.alert("Success", "Settings updated.");
        } catch (e) {
            Alert.alert("Error", "Update failed.");
        } finally {
            setLoading(false);
        }
    };

    // Style helpers
    const inputStyle = [
        styles.input,
        {
            backgroundColor: colors.cardColor,
            color: colors.textColor,
            borderColor: colors.borderColor
        }
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: colors.backgroundColor }}
        >
            <ScrollView contentContainerStyle={styles.container}>

                {/* --- Section: Branding --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Identity</Text>

                    <View style={{ alignItems: 'center', marginBottom: 15 }}>
                        <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
                            {logoUri ? (
                                <Image source={{ uri: logoUri }} style={styles.logo} />
                            ) : (
                                <View style={[styles.placeholder, { borderColor: colors.borderColor }]}>
                                    <Ionicons name="image" size={40} color={colors.secondaryTextColor} />
                                </View>
                            )}
                            <View style={[styles.editBadge, { backgroundColor: colors.primaryColor }]}>
                                <Ionicons name="pencil" size={12} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text style={{ color: colors.secondaryTextColor, fontSize: 12, marginTop: 5 }}>Tap to change Logo</Text>
                    </View>

                    <Text style={[styles.label, { color: colors.textColor }]}>App Name</Text>
                    <TextInput style={inputStyle} value={appTitle} onChangeText={setAppTitle} />
                </View>

                {/* --- Section: Home Texts --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Home Texts</Text>

                    <Text style={[styles.label, { color: colors.textColor }]}>Main Legend</Text>
                    <TextInput style={inputStyle} value={legendMain} onChangeText={setLegendMain} placeholder="e.g. Welcome..." placeholderTextColor={colors.secondaryTextColor} />

                    <Text style={[styles.label, { color: colors.textColor }]}>Secondary Legend</Text>
                    <TextInput style={inputStyle} value={legendSec} onChangeText={setLegendSec} placeholder="e.g. A place of worship..." placeholderTextColor={colors.secondaryTextColor} />
                </View>

                {/* --- Section: History (Rich Text) --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>History / About Us</Text>
                    <TextInput
                        style={[inputStyle, { height: 120, textAlignVertical: 'top' }]}
                        value={historyText}
                        onChangeText={setHistoryText}
                        multiline
                        placeholder="Write the choir's history..."
                        placeholderTextColor={colors.secondaryTextColor}
                    />
                </View>

                {/* --- Section: Contact --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.primaryColor }]}>Contact & Socials</Text>

                    <View style={styles.rowItem}>
                        <Ionicons name="call" size={20} color={colors.textColor} style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={contactPhone} onChangeText={setContactPhone} placeholder="Phone" placeholderTextColor={colors.secondaryTextColor} />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="mail" size={20} color={colors.textColor} style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.secondaryTextColor} autoCapitalize="none" />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp (Link or Number)" placeholderTextColor={colors.secondaryTextColor} />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={facebook} onChangeText={setFacebook} placeholder="Facebook URL" placeholderTextColor={colors.secondaryTextColor} autoCapitalize="none" />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-instagram" size={20} color="#C13584" style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={instagram} onChangeText={setInstagram} placeholder="Instagram URL" placeholderTextColor={colors.secondaryTextColor} autoCapitalize="none" />
                    </View>

                    <View style={styles.rowItem}>
                        <Ionicons name="logo-youtube" size={20} color="#FF0000" style={styles.rowIcon} />
                        <TextInput style={[inputStyle, { flex: 1 }]} value={youtube} onChangeText={setYoutube} placeholder="YouTube URL" placeholderTextColor={colors.secondaryTextColor} autoCapitalize="none" />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.buttonColor }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={colors.buttonTextColor} /> : <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>Save Changes</Text>}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 50 },
    section: { marginBottom: 30 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },

    logoContainer: { position: 'relative' },
    logo: { width: 100, height: 100, borderRadius: 20, resizeMode: 'contain', backgroundColor: '#f0f0f0' },
    placeholder: { width: 100, height: 100, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    editBadge: { position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10 },

    rowItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rowIcon: { width: 30, textAlign: 'center', marginRight: 10 },

    saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3 },
    saveText: { fontWeight: 'bold', fontSize: 16 }
});