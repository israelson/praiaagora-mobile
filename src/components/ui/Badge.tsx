import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium';
}

export default function Badge({ label, variant = 'neutral', size = 'medium' }: BadgeProps) {
  const getBadgeStyle = () => {
    const styles: any[] = [badgeStyles.base];

    switch (variant) {
      case 'success':
        styles.push(badgeStyles.success);
        break;
      case 'warning':
        styles.push(badgeStyles.warning);
        break;
      case 'error':
        styles.push(badgeStyles.error);
        break;
      case 'info':
        styles.push(badgeStyles.info);
        break;
      default:
        styles.push(badgeStyles.neutral);
    }

    if (size === 'small') {
      styles.push(badgeStyles.small);
    }

    return styles;
  };

  const getTextStyle = () => {
    return [
      badgeStyles.text,
      size === 'small' && badgeStyles.textSmall,
    ];
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  success: {
    backgroundColor: `${theme.colors.success}20`,
  },
  warning: {
    backgroundColor: `${theme.colors.warning}20`,
  },
  error: {
    backgroundColor: `${theme.colors.error}20`,
  },
  info: {
    backgroundColor: `${theme.colors.info}20`,
  },
  neutral: {
    backgroundColor: theme.colors.borderLight,
  },
  text: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  textSmall: {
    fontSize: theme.fontSize.xs,
  },
});
