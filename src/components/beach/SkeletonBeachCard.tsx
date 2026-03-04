import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../ui/SkeletonLoader';
import { theme } from '../../theme';

/**
 * Skeleton placeholder that matches the BeachCard shape.
 * Shown while beach data is loading.
 */
export default function SkeletonBeachCard() {
  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <SkeletonLoader height={20} width="55%" borderRadius={6} />
        {/* Favorite icon placeholder */}
        <SkeletonLoader height={28} width={28} borderRadius={14} />
      </View>

      {/* Subtitle: city */}
      <SkeletonLoader height={14} width="35%" borderRadius={4} style={styles.subtitle} />

      {/* Badges row */}
      <View style={styles.badgesRow}>
        <SkeletonLoader height={26} width={80} borderRadius={13} />
        <SkeletonLoader height={26} width={70} borderRadius={13} />
        <SkeletonLoader height={26} width={90} borderRadius={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
