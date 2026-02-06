import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BEACH_ACTIVITIES } from '../constants/beachActivities';
import { theme } from '../theme';

interface ActivityFilterProps {
  selectedActivities: string[];
  onToggleActivity: (activity: string) => void;
}

export default function ActivityFilter({ selectedActivities, onToggleActivity }: ActivityFilterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtrar por Atividade</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BEACH_ACTIVITIES.map((activity) => {
          const isSelected = selectedActivities.includes(activity.value);
          return (
            <TouchableOpacity
              key={activity.value}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onToggleActivity(activity.value)}
            >
              <Text style={styles.emoji}>{activity.emoji}</Text>
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {activity.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  emoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
