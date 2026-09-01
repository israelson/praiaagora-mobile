import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { StormAlert } from '../../utils/stormAlert';

const LEVEL_COLOR: Record<StormAlert['level'], string> = {
  yellow: theme.colors.warning,
  orange: '#f97316',
  red: theme.colors.error,
};

export default function StormAlertBanner({ alert }: { alert: StormAlert }) {
  const color = LEVEL_COLOR[alert.level];

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Ionicons name={alert.icon} size={28} color="#fff" style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.disclaimer}>
          {alert.isOfficial
            ? 'Alerta oficial da Defesa Civil/INMET para esta região.'
            : 'Estimativa Beachly a partir dos dados meteorológicos — não substitui alertas oficiais da Defesa Civil.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    lineHeight: 19,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
});
