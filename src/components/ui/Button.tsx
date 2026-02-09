import React, { forwardRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<any, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      disabled,
      style,
      ...rest
    },
    ref
  ) => {
    const getButtonStyle = () => {
      const styles: any[] = [buttonStyles.base];

      if (fullWidth) styles.push(buttonStyles.fullWidth);

      switch (size) {
        case 'small':
          styles.push(buttonStyles.small);
          break;
        case 'large':
          styles.push(buttonStyles.large);
          break;
        default:
          styles.push(buttonStyles.medium);
      }

      if (variant === 'outline') {
        styles.push(buttonStyles.outline);
      } else if (variant === 'ghost') {
        styles.push(buttonStyles.ghost);
      } else if (variant === 'secondary') {
        styles.push(buttonStyles.secondary);
      }

      if (disabled || loading) {
        styles.push(buttonStyles.disabled);
      }

      return styles;
    };

    const getTextStyle = () => {
      const styles: any[] = [buttonStyles.text];

      switch (size) {
        case 'small':
          styles.push(buttonStyles.textSmall);
          break;
        case 'large':
          styles.push(buttonStyles.textLarge);
          break;
        default:
          styles.push(buttonStyles.textMedium);
      }

      if (variant === 'outline' || variant === 'ghost') {
        styles.push(buttonStyles.textPrimary);
      }

      return styles;
    };

    const content = (
      <>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.primary} />
        ) : (
          <Text style={getTextStyle()}>{title}</Text>
        )}
      </>
    );

    if (variant === 'primary' && !disabled && !loading) {
      return (
        <TouchableOpacity
          ref={ref}
          disabled={disabled || loading}
          style={[...getButtonStyle(), style]}
          {...rest}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={buttonStyles.gradient}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled || loading}
        style={[...getButtonStyle(), style]}
        {...rest}
      >
        {content}
      </TouchableOpacity>
    );
  }
);

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.textInverse,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: theme.fontSize.sm,
  },
  textMedium: {
    fontSize: theme.fontSize.md,
  },
  textLarge: {
    fontSize: theme.fontSize.lg,
  },
  textPrimary: {
    color: theme.colors.primary,
  },
});

export default Button;
