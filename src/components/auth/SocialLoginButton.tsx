import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface SocialLoginButtonProps {
  provider: 'google';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function SocialLoginButton({
  provider,
  onPress,
  disabled = false,
  loading = false,
}: SocialLoginButtonProps) {
  const config = {
    google: {
      icon: 'logo-google' as const,
      label: 'Continuar com Google',
      bgColor: '#FFFFFF',
      textColor: '#1F2937',
      borderColor: '#E5E7EB',
    },
  };

  const style = config[provider];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: style.bgColor,
          borderColor: style.borderColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={style.textColor} />
      ) : (
        <>
          <Ionicons
            name={style.icon}
            size={20}
            color={style.textColor}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: style.textColor }]}>
            {style.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.6,
  },
});
