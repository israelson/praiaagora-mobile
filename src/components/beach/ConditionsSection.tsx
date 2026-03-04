import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../ui/Card';
import { theme } from '../../theme';
import { formatWindInfo } from '../../utils/weather';

interface Conditions {
  air_temperature?: number;
  water_temperature?: number;
  wind_speed?: number;
  wind_direction?: number;
  uv_index?: number | null;
  wave_height?: number;
  humidity?: number;
  weather_description?: string;
  recorded_at?: string;
}

interface Props {
  conditions: Conditions;
}

export default function ConditionsSection({ conditions }: Props) {
  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Condições Atuais</Text>
      <View style={styles.grid}>
        {conditions.air_temperature != null && (
          <View style={styles.item}>
            <Ionicons name="thermometer-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.value}>{conditions.air_temperature.toFixed(1)}°C</Text>
            <Text style={styles.label}>Temperatura</Text>
          </View>
        )}
        {conditions.water_temperature != null && (
          <View style={styles.item}>
            <Ionicons name="water-outline" size={24} color={theme.colors.info} />
            <Text style={styles.value}>{conditions.water_temperature.toFixed(1)}°C</Text>
            <Text style={styles.label}>Água</Text>
          </View>
        )}
        {conditions.wind_speed != null && (
          <View style={styles.item}>
            <Ionicons name="flag-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.value}>
              {conditions.wind_direction
                ? formatWindInfo(conditions.wind_speed, conditions.wind_direction)
                : `${conditions.wind_speed.toFixed(1)} km/h`}
            </Text>
            <Text style={styles.label}>Vento</Text>
          </View>
        )}
        {conditions.uv_index != null && (
          <View style={styles.item}>
            <Ionicons name="sunny-outline" size={24} color={theme.colors.error} />
            <Text style={styles.value}>{conditions.uv_index}</Text>
            <Text style={styles.label}>Índice UV</Text>
          </View>
        )}
        {conditions.wave_height != null && (
          <View style={styles.item}>
            <Ionicons name="analytics-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.value}>{conditions.wave_height.toFixed(1)}m</Text>
            <Text style={styles.label}>Ondas</Text>
          </View>
        )}
        {conditions.humidity != null && (
          <View style={styles.item}>
            <Ionicons name="rainy-outline" size={24} color={theme.colors.info} />
            <Text style={styles.value}>{conditions.humidity}%</Text>
            <Text style={styles.label}>Umidade</Text>
          </View>
        )}
      </View>
      {conditions.weather_description && (
        <View style={styles.weather}>
          <Ionicons name="cloud-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.weatherText}>{conditions.weather_description}</Text>
        </View>
      )}
      {conditions.recorded_at && (
        <Text style={styles.recorded}>
          Atualizado em{' '}
          {format(new Date(conditions.recorded_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.spacing.md },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  item: { width: '30%', alignItems: 'center', padding: theme.spacing.sm },
  value: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  weatherText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  recorded: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});
