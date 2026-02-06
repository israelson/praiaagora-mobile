import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { theme } from '../../theme';

const CROWD_LEVELS = [
  { value: 'LOW', label: 'Baixa', icon: 'people', color: theme.colors.crowdLow },
  { value: 'MEDIUM', label: 'Moderada', icon: 'people', color: theme.colors.crowdModerate },
  { value: 'HIGH', label: 'Alta', icon: 'people', color: theme.colors.crowdHigh },
  { value: 'VERY_HIGH', label: 'Muito Alta', icon: 'people', color: theme.colors.crowdVeryHigh },
];

export default function CheckInScreen({ route, navigation }: any) {
  const { beachId } = route.params;
  const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!selectedCrowdLevel) {
      Alert.alert('Atenção', 'Por favor, selecione o nível de lotação');
      return;
    }

    setLoading(true);
    try {
      await api.createCheckIn(beachId, {
        crowd_level: selectedCrowdLevel as any,
      });

      Alert.alert(
        'Check-in Realizado!',
        'Obrigado por contribuir com a comunidade PraiaAgora 🌊'
      );
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = typeof error.response?.data?.detail === 'string' 
        ? error.response.data.detail 
        : 'Não foi possível realizar o check-in';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.infoCard} variant="filled">
          <Ionicons name="information-circle" size={32} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Ajude outros usuários informando como está a lotação da praia agora
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Nível de Lotação *</Text>
        <View style={styles.crowdLevels}>
          {CROWD_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.crowdLevelCard,
                selectedCrowdLevel === level.value && {
                  borderColor: level.color,
                  backgroundColor: `${level.color}10`,
                },
              ]}
              onPress={() => setSelectedCrowdLevel(level.value)}
            >
              <Ionicons
                name={level.icon as any}
                size={32}
                color={selectedCrowdLevel === level.value ? level.color : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.crowdLevelLabel,
                  selectedCrowdLevel === level.value && {
                    color: level.color,
                    fontWeight: theme.fontWeight.bold,
                  },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Realizar Check-in"
          onPress={handleCheckIn}
          loading={loading}
          fullWidth
          size="large"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  crowdLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  crowdLevelCard: {
    width: '47%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  crowdLevelLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xl,
  },
});
