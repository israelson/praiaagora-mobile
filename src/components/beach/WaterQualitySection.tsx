import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { theme } from '../../theme';

type WaterQuality = 'PROPER' | 'IMPROPER' | 'EXCELLENT' | 'GOOD' | 'REGULAR' | string;

interface Props {
  waterQuality: WaterQuality | null | undefined;
  waterQualityUpdatedAt?: string | null;
  waterQualityPoints?: number | null;
}

function qualityLabel(q: WaterQuality) {
  const map: Record<string, string> = {
    PROPER: '✅ Própria',
    IMPROPER: '❌ Imprópria',
    EXCELLENT: 'Excelente',
    GOOD: 'Boa',
    REGULAR: 'Regular',
  };
  return map[q] ?? 'Imprópria';
}

function qualityVariant(q: WaterQuality): 'success' | 'warning' | 'error' {
  if (['PROPER', 'EXCELLENT', 'GOOD'].includes(q)) return 'success';
  if (q === 'REGULAR') return 'warning';
  return 'error';
}

function qualityText(q: WaterQuality) {
  if (['PROPER', 'EXCELLENT', 'GOOD'].includes(q)) return '🏖️ Água própria para banho';
  if (q === 'REGULAR') return '⚠️ Cuidado: qualidade regular';
  return '🚫 Água imprópria — evite contato com o mar';
}

export default function WaterQualitySection({
  waterQuality,
  waterQualityUpdatedAt,
  waterQualityPoints,
}: Props) {
  return (
    <Card style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="water" size={24} color={theme.colors.primary} />
        <Text style={styles.title}>Qualidade da Água</Text>
      </View>

      {waterQuality ? (
        <View style={styles.container}>
          <Badge label={qualityLabel(waterQuality)} variant={qualityVariant(waterQuality)} />
          <Text style={styles.qualityText}>{qualityText(waterQuality)}</Text>
          {waterQualityUpdatedAt && (
            <View style={styles.updateInfo}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.updateText}>
                Atualizado em{' '}
                {format(new Date(waterQualityUpdatedAt), 'dd/MM/yyyy', { locale: ptBR })}
              </Text>
            </View>
          )}
          {waterQualityPoints && (
            <Text style={styles.sourceText}>
              Fonte: IMA-SC ({waterQualityPoints}{' '}
              {waterQualityPoints === 1 ? 'ponto' : 'pontos'} de coleta)
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.noData}
          onPress={() =>
            Alert.alert(
              'Importante',
              'A ausência de dados de monitoramento IMA‑SC não significa que a água esteja imprópria. Praias sem monitoramento podem ter boa qualidade, mas não há análises oficiais disponíveis.'
            )
          }
        >
          <Ionicons name="information-circle-outline" size={48} color={theme.colors.info} />
          <Text style={styles.noDataTitle}>Sem monitoramento IMA-SC</Text>
          <Text style={styles.noDataText}>Toque para mais informações</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  container: { alignItems: 'center', gap: theme.spacing.sm },
  qualityText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  updateText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  sourceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  noData: { alignItems: 'center', paddingVertical: theme.spacing.lg },
  noDataTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
