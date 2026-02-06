import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export default function Card({ children, style, variant = 'elevated' }: CardProps) {
  const getCardStyle = () => {
    const styles: any[] = [cardStyles.base];

    switch (variant) {
      case 'outlined':
        styles.push(cardStyles.outlined);
        break;
      case 'filled':
        styles.push(cardStyles.filled);
        break;
      default:
        styles.push(cardStyles.elevated);
    }

    return styles;
  };

  return <View style={[...getCardStyle(), style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
  },
  elevated: {
    ...theme.shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filled: {
    backgroundColor: theme.colors.background,
  },
});
