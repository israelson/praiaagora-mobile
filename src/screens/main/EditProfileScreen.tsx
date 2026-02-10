import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { theme } from '../../theme';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [city, setCity] = useState(user?.city || '');
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const uri = await AsyncStorage.getItem('user_avatar');
        if (uri) setAvatarUri(uri);
      } catch (e) {
        console.error('Erro lendo avatar', e);
      }
    };
    loadAvatar();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName, city });
      // Persist avatar locally (server may not support avatar upload)
      if (avatarUri) {
        await AsyncStorage.setItem('user_avatar', avatarUri);
      }

      // update auth context user (merge server response and local avatar)
      updateUser({ ...updated, avatar: avatarUri || undefined });
      Alert.alert('Salvo', 'Perfil atualizado com sucesso');
      navigation.goBack();
    } catch (e) {
      console.error('Erro atualizando perfil', e);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita acesso à galeria para escolher uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.cancelled) {
        setAvatarUri(result.uri);
      }
    } catch (e) {
      console.error('Erro escolhendo avatar', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ color: theme.colors.textSecondary }}>Selecionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nome completo</Text>
        <Input value={fullName} onChangeText={setFullName} placeholder="Seu nome" />

        <Text style={styles.label}>E-mail (não editável)</Text>
        <Input value={user?.email || ''} editable={false} />

        <Text style={styles.label}>Cidade</Text>
        <Input value={city} onChangeText={setCity} placeholder="Cidade" />

        <Button title="Salvar" onPress={handleSave} loading={loading} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  form: { gap: theme.spacing.md },
  label: { color: theme.colors.textSecondary, marginBottom: 6 },
});
