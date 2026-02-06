import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BEACH_ACTIVITIES } from '../constants/beachActivities';
import { theme } from '../theme';

interface ActivityBadgesProps {
  activities: string[];
  maxVisible?: number;
  size?: 'small' | 'medium';
}

export default function ActivityBadges({ activities, maxVisible = 3, size = 'small' }: ActivityBadgesProps) {
  if (!activities || activities.length === 0) return null;

  const visibleActivities = activities.slice(0, maxVisible);
  const remaining = activities.length - maxVisible;

  const getActivityEmoji = (value: string) => {
    const activity = BEACH_ACTIVITIES.find(a => a.value === value);
    return activity?.emoji || '📍';
  };

  const getActivityLabel = (value: string) => {
    const activity = BEACH_ACTIVITIES.find(a => a.value === value);
    return activity?.label || value;
  };

  const isSmall = size === 'small';

  return (
    <View style={styles.container}>
      {visibleActivities.map((activity, index) => (
        <View key={index} style={[styles.badge, isSmall && styles.badgeSmall]}>
          <Text style={[styles.emoji, isSmall && styles.emojiSmall]}>
            {getActivityEmoji(activity)}
          </Text>
          {size === 'medium' && (
            <Text style={styles.label}>{getActivityLabel(activity)}</Text>
          )}
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.badge, styles.badgeMore, isSmall && styles.badgeSmall]}>
          <Text style={[styles.moreText, isSmall && styles.moreTextSmall]}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeMore: {
    backgroundColor: theme.colors.border,
  },
  emoji: {
    fontSize: 14,
  },
  emojiSmall: {
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  moreText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  moreTextSmall: {
    fontSize: 10,
  },
});
