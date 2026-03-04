import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import { CrowdBadge } from '../CrowdBadge';
import { theme } from '../../theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  crowdData: {
    crowd_level: string;
    confidence_score: number;
    last_updated?: string;
    calculated_at?: string;
  };
}

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  } catch {
    return '';
  }
}

export default function CrowdSection({ crowdData }: Props) {
  if (!crowdData || crowdData.confidence_score <= 0) return null;

  const updatedAt = crowdData.last_updated || crowdData.calculated_at;

  return (
    <Card style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Lotação</Text>
        <TouchableOpacity
          style={styles.badge}
          onPress={() =>
            Alert.alert(
              'Estimativa de lotação',
              `Atualizado ${timeAgo(updatedAt)}\n\nEsta estimativa é calculada com base em fontes como check-ins, fluxo de trânsito e padrões históricos. Pode não refletir a lotação real no momento.`
            )
          }
        >
          <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.badgeText}>Estimativa</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.crowdContainer}>
        <CrowdBadge level={crowdData.crowd_level as any} size="large" showLabel />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  crowdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
});
