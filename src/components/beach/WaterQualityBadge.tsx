import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';
import { theme } from '../../theme';

type WaterQuality = 'PROPER' | 'IMPROPER' | null;

interface WaterQualityBadgeProps {
  quality: WaterQuality;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  updatedAt?: string | null;
}

/**
 * Badge component para exibir qualidade da água (Balneabilidade)
 * 
 * @param quality - Classificação: PROPER (própria), IMPROPER (imprópria) ou null
 * @param showIcon - Se deve mostrar ícone ao lado do texto
 * @param size - Tamanho do badge
 * @param updatedAt - Data de atualização dos dados (ISO string)
 */
export default function WaterQualityBadge({
  quality,
  showIcon = true,
  size = 'small',
  updatedAt,
}: WaterQualityBadgeProps) {
  if (!quality) {
    return (
      <Badge
        label="Sem dados"
        variant="neutral"
        size={size}
      />
    );
  }

  const config = {
    PROPER: {
      label: '✅ Própria',
      variant: 'success' as const,
      icon: 'checkmark-circle',
      color: theme.colors.success,
    },
    IMPROPER: {
      label: '❌ Imprópria',
      variant: 'error' as const,
      icon: 'close-circle',
      color: theme.colors.error,
    },
  };

  const badgeConfig = config[quality];

  // Verifica se dado é recente (até 3 dias)
  const isDataFresh = () => {
    if (!updatedAt) return true;
    const updated = new Date(updatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - updated.getTime()) / 86400000);
    return daysDiff <= 3;
  };

  return (
    <View style={styles.container}>
      {showIcon ? (
        <View style={styles.badgeWithIcon}>
          <Ionicons 
            name={badgeConfig.icon as any} 
            size={16} 
            color={badgeConfig.color} 
          />
          <Text style={[styles.text, { color: badgeConfig.color }]}>
            {badgeConfig.label.replace('✅ ', '').replace('❌ ', '')}
          </Text>
        </View>
      ) : (
        <Badge
          label={badgeConfig.label}
          variant={badgeConfig.variant}
          size={size}
        />
      )}
      
      {/* Indicador de atualização */}
      {updatedAt && !isDataFresh() && (
        <View style={styles.staleIndicator}>
          <Ionicons name="time-outline" size={10} color={theme.colors.warning} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  text: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  staleIndicator: {
    marginLeft: 4,
  },
});
