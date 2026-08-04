// src/screens/admin/ManageUserScreen.tsx

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
import * as ImagePicker from 'expo-image-picker';
import {
    useNavigation,
    useRoute,
    type NavigationProp,
    type RouteProp
} from '@react-navigation/native';
import { canManageUsers, isSuperAdmin } from '../../auth/permissions';
import { AccessDeniedScreen } from '../../components/auth/AccessDeniedScreen';
import { useTheme } from '../../context/ThemeContext';
import type { TenantManagedRole } from '../../services/admin/users';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTargetChoirStore } from '../../store/useTargetChoirStore';
import type { User } from '../../types/auth';

type UserManagementParamList = {
    readonly UsersListScreen: undefined;
    readonly ManageUserScreen: { readonly user?: User } | undefined;
};

const MANAGED_ROLES: readonly TenantManagedRole[] = ['VIEWER', 'USER', 'EDITOR', 'ADMIN'];

const normalizeRole = (role: User['role'] | undefined): TenantManagedRole => {
    return MANAGED_ROLES.find((candidate) => candidate === role) ?? 'VIEWER';
};

const isValidTemporaryPassword = (value: string): boolean => {
    return value.length >= 12 &&
        value.length <= 128 &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /[0-9]/.test(value) &&
        /[^A-Za-z0-9]/.test(value);
};

export const ManageUserScreen = () => {
    const navigation = useNavigation<NavigationProp<UserManagementParamList>>();
    const route = useRoute<RouteProp<UserManagementParamList, 'ManageUserScreen'>>();
    const colors = useTheme().currentTheme;
    const currentUser = useAuthStore((state) => state.user);
    const selectedChoir = useTargetChoirStore((state) => state.selectedChoir);
    const { saveUserAction, loading } = useAdminUsersStore();
    const editingUser = route.params?.user;
    const isEdit = Boolean(editingUser);
    const [name, setName] = useState(editingUser?.name ?? '');
    const [username, setUsername] = useState(editingUser?.username ?? '');
    const [email, setEmail] = useState(editingUser?.email ?? '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<TenantManagedRole>(normalizeRole(editingUser?.role));
    const [instrumentLabel, setInstrumentLabel] = useState(editingUser?.instrumentLabel ?? editingUser?.instrument ?? '');
    const [bio, setBio] = useState(editingUser?.bio ?? '');
    const [voice, setVoice] = useState(editingUser?.voice ?? false);
    const [imageUri, setImageUri] = useState<string | null>(editingUser?.cachedImageUrl ?? editingUser?.imageUrl ?? null);
    const requiresTarget = isSuperAdmin(currentUser?.role);

    useLayoutEffect(() => {
        navigation.setOptions({ title: isEdit ? 'Editar usuario' : 'Nuevo usuario' });
    }, [isEdit, navigation]);

    if (!canManageUsers(currentUser?.role)) {
        return <AccessDeniedScreen />;
    }

    if (requiresTarget && !selectedChoir) {
        return (
            <AccessDeniedScreen
                title="Selecciona un coro"
                message="Debes seleccionar un coro antes de crear o editar usuarios."
            />
        );
    }

    const pickImage = async (): Promise<void> => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            aspect: [1, 1],
            allowsEditing: true
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const submit = async (): Promise<void> => {
        if (!name.trim() || !username.trim() || !email.trim()) {
            Alert.alert('Datos incompletos', 'Nombre, usuario y correo son obligatorios.');
            return;
        }

        if (!isEdit && password.length > 0 && !isValidTemporaryPassword(password)) {
            Alert.alert(
                'Contraseña temporal',
                'Debe contener entre 12 y 128 caracteres, con mayúscula, minúscula, número y símbolo.'
            );
            return;
        }

        const result = await saveUserAction(
            {
                name: name.trim(),
                username: username.trim().toLowerCase(),
                email: email.trim().toLowerCase(),
                password: password || undefined,
                role,
                instrumentLabel: instrumentLabel.trim(),
                bio: bio.trim(),
                voice
            },
            imageUri ?? undefined,
            editingUser?.id
        );

        if (!result) {
            Alert.alert(
                'Error',
                useAdminUsersStore.getState().errorMessage ?? 'No fue posible guardar el usuario.'
            );
            return;
        }

        if (!isEdit && result.temporaryPassword) {
            Alert.alert(
                'Usuario creado',
                `Contraseña temporal: ${result.temporaryPassword}`,
                [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
            );
            return;
        }

        Alert.alert('Éxito', `Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente.`);
        navigation.goBack();
    };

    const inputStyle = [
        styles.input,
        {
            color: colors.textColor,
            borderColor: colors.borderColor,
            backgroundColor: colors.cardColor
        }
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flex, { backgroundColor: colors.backgroundColor }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                automaticallyAdjustKeyboardInsets
            >
                <Text style={[styles.context, { color: colors.secondaryTextColor }]}>
                    Coro: {selectedChoir?.name ?? 'Tu coro'}
                </Text>

                <TouchableOpacity onPress={() => void pickImage()} style={styles.avatarContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={[styles.avatar, { borderColor: colors.primaryColor }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardColor, borderColor: colors.borderColor }]}>
                            <Ionicons name="person-outline" size={48} color={colors.secondaryTextColor} />
                        </View>
                    )}
                    <View style={[styles.cameraIcon, { backgroundColor: colors.primaryColor }]}>
                        <Ionicons name="camera-outline" size={16} color={colors.buttonTextColor} />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.textColor }]}>Nombre</Text>
                <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Nombre completo" placeholderTextColor={colors.secondaryTextColor} autoCorrect spellCheck autoCapitalize="words" />

                <Text style={[styles.label, { color: colors.textColor }]}>Usuario</Text>
                <TextInput style={inputStyle} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="usuario" placeholderTextColor={colors.secondaryTextColor} />

                <Text style={[styles.label, { color: colors.textColor }]}>Correo</Text>
                <TextInput style={inputStyle} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="correo@ejemplo.com" placeholderTextColor={colors.secondaryTextColor} />

                {!isEdit && (
                    <>
                        <Text style={[styles.label, { color: colors.textColor }]}>Contraseña temporal</Text>
                        <TextInput style={inputStyle} value={password} onChangeText={setPassword} secureTextEntry placeholder="Opcional: el API puede generarla" placeholderTextColor={colors.secondaryTextColor} />
                    </>
                )}

                <Text style={[styles.label, { color: colors.textColor }]}>Rol</Text>
                <View style={styles.roles}>
                    {MANAGED_ROLES.map((managedRole) => (
                        <TouchableOpacity
                            key={managedRole}
                            onPress={() => setRole(managedRole)}
                            style={[
                                styles.roleButton,
                                { borderColor: role === managedRole ? colors.primaryColor : colors.borderColor },
                                role === managedRole && { backgroundColor: colors.primaryColor }
                            ]}
                        >
                            <Text style={{ color: role === managedRole ? colors.buttonTextColor : colors.textColor, fontWeight: '800', fontSize: 12 }}>
                                {managedRole}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: colors.textColor }]}>Instrumento</Text>
                <TextInput style={inputStyle} value={instrumentLabel} onChangeText={setInstrumentLabel} placeholder="Ej. Guitarra, Voz" placeholderTextColor={colors.secondaryTextColor} autoCorrect spellCheck autoCapitalize="words" />

                <Text style={[styles.label, { color: colors.textColor }]}>Biografía</Text>
                <TextInput style={[inputStyle, styles.textArea]} value={bio} onChangeText={setBio} multiline placeholder="Breve descripción" placeholderTextColor={colors.secondaryTextColor} autoCorrect spellCheck autoCapitalize="sentences" />

                <View style={[styles.switchRow, { borderColor: colors.borderColor, backgroundColor: colors.cardColor }]}>
                    <Text style={[styles.switchLabel, { color: colors.textColor }]}>Participa como voz</Text>
                    <Switch value={voice} onValueChange={setVoice} />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.buttonColor, opacity: loading ? 0.7 : 1 }]}
                    onPress={() => void submit()}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.buttonTextColor} />
                    ) : (
                        <Text style={[styles.saveText, { color: colors.buttonTextColor }]}>{isEdit ? 'Actualizar usuario' : 'Crear usuario'}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { padding: 20, paddingBottom: 140 },
    context: { marginBottom: 14, fontSize: 13, fontWeight: '700' },
    avatarContainer: { alignSelf: 'center', marginBottom: 18 },
    avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 2 },
    avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cameraIcon: { position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 14, fontWeight: '800', marginTop: 12, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
    textArea: { minHeight: 88, textAlignVertical: 'top' },
    roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleButton: { minWidth: 78, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center' },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 11, padding: 13, marginTop: 18 },
    switchLabel: { fontSize: 15, fontWeight: '700' },
    saveButton: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
    saveText: { fontSize: 16, fontWeight: '900' }
});
