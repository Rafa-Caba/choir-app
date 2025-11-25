import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAdminUsersStore } from '../../store/useAdminUsersStore';

export const ManageUserScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { saveUserAction, loading } = useAdminUsersStore();

    // If user param exists, we are Editing. Else Creating.
    const editingUser = route.params?.user;
    const isEdit = !!editingUser;

    const [name, setName] = useState(editingUser?.name || '');
    const [username, setUsername] = useState(editingUser?.username || '');
    const [email, setEmail] = useState(editingUser?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(editingUser?.role || 'USER');
    const [instrument, setInstrument] = useState(editingUser?.instrument || 'Voz');
    const [imageUri, setImageUri] = useState<string | undefined>(editingUser?.imageUrl);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            aspect: [1, 1],
            allowsEditing: true
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSubmit = async () => {
        if (!name || !username || !email) {
            Alert.alert("Error", "Faltan campos obligatorios");
            return;
        }
        
        // If creating, password is required
        if (!isEdit && !password) {
             Alert.alert("Error", "Contraseña requerida para nuevos usuarios");
             return;
        }

        const payload = { name, username, email, password, role, instrument };
        
        const success = await saveUserAction(payload, imageUri, editingUser?.id);
        
        if (success) {
            Alert.alert("Éxito", isEdit ? "Usuario actualizado" : "Usuario creado");
            navigation.goBack();
        } else {
            Alert.alert("Error", "No se pudo guardar");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
            
            {/* Avatar Picker */}
            <TouchableOpacity onPress={pickImage} style={{alignSelf:'center', marginBottom: 20}}>
                <Image 
                    source={{ uri: imageUri || 'https://via.placeholder.com/100' }} 
                    style={styles.avatar} 
                />
                <Text style={{textAlign:'center', color:'#8B4BFF', marginTop:5}}>Cambiar Foto</Text>
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Usuario" value={username} onChangeText={setUsername} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
            
            <TextInput 
                style={styles.input} 
                placeholder={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />

            {/* Simple Role Selector */}
            <View style={styles.row}>
                <Text style={styles.label}>Rol:</Text>
                {['USER', 'EDITOR', 'ADMIN'].map(r => (
                    <TouchableOpacity 
                        key={r} 
                        onPress={() => setRole(r)}
                        style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                    >
                        <Text style={{color: role === r ? 'white' : '#333'}}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput style={styles.input} placeholder="Instrumento" value={instrument} onChangeText={setInstrument} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="white"/> : <Text style={styles.saveText}>Guardar</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign:'center' },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    saveBtn: { backgroundColor: '#8B4BFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 15 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
    label: { fontSize: 16, fontWeight: '600' },
    roleBtn: { padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
    roleBtnActive: { backgroundColor: '#8B4BFF', borderColor: '#8B4BFF' }
});