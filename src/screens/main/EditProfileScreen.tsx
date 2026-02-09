import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName, city });
      // update auth context user
      updateUser(updated);
      Alert.alert('Salvo', 'Perfil atualizado com sucesso');
      navigation.goBack();
    } catch (e) {
      console.error('Erro atualizando perfil', e);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nome completo</Text>
        <Input value={fullName} onChangeText={setFullName} placeholder="Seu nome" />

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
