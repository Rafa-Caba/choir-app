import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
    Image, Alert, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSettings, updateSettings } from '../../services/admin/settings';

export const AdminSettingsScreen = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    const [loading, setLoading] = useState(false);
    const [appTitle, setAppTitle] = useState('');
    const [logoUri, setLogoUri] = useState<string | null>(null);
    
    // Socials
    const [facebook, setFacebook] = useState('');
    const [instagram, setInstagram] = useState('');
    const [youtube, setYoutube] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setAppTitle(data.appTitle || '');
            setLogoUri(data.appLogoUrl || null);
            if (data.socialLinks) {
                setFacebook(data.socialLinks.facebook || '');
                setInstagram(data.socialLinks.instagram || '');
                setYoutube(data.socialLinks.youtube || '');
                setWhatsapp(data.socialLinks.whatsapp || '');
            }
        } catch (e) {
            Alert.alert("Error", "No se pudieron cargar las configuraciones");
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
        const payload = {
            appTitle,
            socialLinks: { facebook, instagram, youtube, whatsapp }
        };

        try {
            await updateSettings(payload, logoUri || undefined);
            Alert.alert("Éxito", "Configuración actualizada");
        } catch (e) {
            Alert.alert("Error", "Falló la actualización");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            
            {/* Logo Picker */}
            <View style={styles.section}>
                <Text style={[styles.label, {color: colors.text}]}>Logo de la App</Text>
                <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
                    {logoUri ? (
                        <Image source={{ uri: logoUri }} style={styles.logo} />
                    ) : (
                        <View style={[styles.placeholder, {borderColor: colors.border}]}>
                            <Ionicons name="image" size={40} color={colors.textSecondary} />
                        </View>
                    )}
                    <Text style={{color: colors.primary, marginTop: 10}}>Cambiar Logo</Text>
                </TouchableOpacity>
            </View>

            {/* General Settings */}
            <View style={styles.section}>
                <Text style={[styles.label, {color: colors.text}]}>Nombre de la App</Text>
                <TextInput 
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={appTitle} onChangeText={setAppTitle}
                />
            </View>

            {/* Social Links */}
            <View style={styles.section}>
                <Text style={[styles.header, {color: colors.primary}]}>Redes Sociales</Text>
                
                <View style={styles.inputRow}>
                    <Ionicons name="logo-facebook" size={24} color="#1877F2" style={styles.icon} />
                    <TextInput 
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, flex: 1 }]}
                        placeholder="URL de Facebook"
                        placeholderTextColor={colors.textSecondary}
                        value={facebook} onChangeText={setFacebook}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Ionicons name="logo-instagram" size={24} color="#C13584" style={styles.icon} />
                    <TextInput 
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, flex: 1 }]}
                        placeholder="URL de Instagram"
                        placeholderTextColor={colors.textSecondary}
                        value={instagram} onChangeText={setInstagram}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" style={styles.icon} />
                    <TextInput 
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, flex: 1 }]}
                        placeholder="Número WhatsApp"
                        placeholderTextColor={colors.textSecondary}
                        value={whatsapp} onChangeText={setWhatsapp}
                    />
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.button }]} 
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white"/> : <Text style={styles.saveText}>Guardar Cambios</Text>}
            </TouchableOpacity>

            <View style={{height: 50}} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    section: { marginBottom: 25 },
    header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    logoContainer: { alignItems: 'center' },
    logo: { width: 100, height: 100, borderRadius: 20, resizeMode: 'contain' },
    placeholder: { width: 100, height: 100, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    icon: { marginRight: 10, width: 30, textAlign: 'center' },
    saveBtn: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});