import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CrowdLevel = 'low' | 'medium' | 'high' | 'very_high' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

interface CrowdBadgeProps {
  level: CrowdLevel | null | undefined;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
}

const CROWD_CONFIG = {
  low: {
    emoji: '🟢',
    color: '#10b981',
    bgColor: '#d1fae5',
    label: 'Pode estar vazia',
    description: 'Possivelmente tranquila'
  },
  LOW: {
    emoji: '🟢',
    color: '#10b981',
    bgColor: '#d1fae5',
    label: 'Pode estar vazia',
    description: 'Possivelmente tranquila'
  },
  medium: {
    emoji: '🟡',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Possivelmente moderada',
    description: 'Tende a ter movimento moderado'
  },
  MEDIUM: {
    emoji: '🟡',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Possivelmente moderada',
    description: 'Tende a ter movimento moderado'
  },
  high: {
    emoji: '🟠',
    color: '#f97316',
    bgColor: '#ffedd5',
    label: 'Tende a estar cheia',
    description: 'Provavelmente com bastante movimento'
  },
  HIGH: {
    emoji: '🟠',
    color: '#f97316',
    bgColor: '#ffedd5',
    label: 'Tende a estar cheia',
    description: 'Provavelmente com bastante movimento'
  },
  very_high: {
    emoji: '🔴',
    color: '#ef4444',
    bgColor: '#fee2e2',
    label: 'Provavelmente lotada',
    description: 'Tende a estar muito cheia'
  },
  VERY_HIGH: {
    emoji: '🔴',
    color: '#ef4444',
    bgColor: '#fee2e2',
    label: 'Provavelmente lotada',
    description: 'Tende a estar muito cheia'
  }
};

const SIZES = {
  small: {
    fontSize: 10,
    emojiSize: 12,
    paddingV: 2,
    paddingH: 6,
    borderRadius: 8
  },
  medium: {
    fontSize: 12,
    emojiSize: 14,
    paddingV: 4,
    paddingH: 8,
    borderRadius: 10
  },
  large: {
    fontSize: 14,
    emojiSize: 16,
    paddingV: 6,
    paddingH: 12,
    borderRadius: 12
  }
};

/**
 * Badge visual de nível de lotação da praia.
 * 
 * Exibe indicador colorido com emoji representando o nível
 * de ocupação atual da praia.
 * 
 * @component
 * @example
 * ```tsx
 * <CrowdBadge level="medium" size="small" showLabel={true} />
 * ```
 */
export function CrowdBadge({ 
  level, 
  size = 'medium', 
  showLabel = false,
  style 
}: CrowdBadgeProps) {
  if (!level) {
    return null;
  }

  const config = CROWD_CONFIG[level];
  const sizeConfig = SIZES[size];

  if (!config) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          paddingVertical: sizeConfig.paddingV,
          paddingHorizontal: sizeConfig.paddingH,
          borderRadius: sizeConfig.borderRadius,
          borderColor: config.color,
          borderWidth: 1
        },
        style
      ]}
    >
      <Text style={{ fontSize: sizeConfig.emojiSize }}>
        {config.emoji}
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: sizeConfig.fontSize, color: config.color }
          ]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
}

/**
 * Retorna configuração de cor/label para um nível de lotação.
 * Útil para usar fora do componente.
 */
export function getCrowdConfig(level: CrowdLevel | null | undefined) {
  if (!level) return null;
  return CROWD_CONFIG[level];
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  label: {
    fontWeight: '600'
  }
});
