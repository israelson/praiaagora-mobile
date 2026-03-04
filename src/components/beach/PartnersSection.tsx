import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import { theme } from '../../theme';

interface Partner {
  id: number;
  name: string;
  category: string;
  distance?: number;
}

interface Props {
  partners: Partner[];
  onPress: (partnerId: number) => void;
}

function partnerIcon(category: string): any {
  const map: Record<string, string> = {
    HOTEL: 'bed',
    RESTAURANT: 'restaurant',
    SURF_SCHOOL: 'fitness',
  };
  return map[category] ?? 'business';
}

export default function PartnersSection({ partners, onPress }: Props) {
  if (!partners || partners.length === 0) return null;

  return (
    <Card style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Parceiros Próximos</Text>
      </View>
      {partners.map((partner) => (
        <TouchableOpacity
          key={partner.id}
          style={styles.item}
          onPress={() => onPress(partner.id)}
        >
          <View style={styles.icon}>
            <Ionicons name={partnerIcon(partner.category)} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{partner.name}</Text>
            <Text style={styles.distance}>
              {partner.distance ? `${partner.distance.toFixed(1)} km` : 'Próximo'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  info: { flex: 1 },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  distance: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
