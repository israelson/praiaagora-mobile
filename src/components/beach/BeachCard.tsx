import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { CrowdBadge } from '../CrowdBadge';
import ActivityBadges from '../ActivityBadges';
import { theme } from '../../theme';
import { openNavigationWithChoice } from '../../utils/navigation';

interface Beach {
  id: number;
  name: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  water_quality?: 'PROPER' | 'IMPROPER' | null;
  water_quality_updated_at?: string | null;
  water_quality_confidence?: 'high' | 'medium' | 'low' | null;
  crowd_level?: 'low' | 'medium' | 'high' | 'very_high' | null;
  crowd_confidence?: number; // 0.0 a 1.0
  temperature?: number;
  has_lifeguard?: boolean;
  icp?: number;
  icp_rating?: string;
  distance_formatted?: string;
  activities?: string[];
}

interface BeachCardProps {
  beach: Beach;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showDistance?: boolean;
  distance?: number;
  showNavigation?: boolean;
}

export default function BeachCard({
  beach,
  onPress,
  isFavorite,
  onToggleFavorite,
  showDistance,
  distance,
  showNavigation = true,
}: BeachCardProps) {
  const getStatusBadge = () => {
    if (!beach.status) return null;
    
    const variantMap: any = {
      OPEN: 'success',
      CLOSED: 'error',
      ALERT: 'warning',
    };

    const labelMap: any = {
      OPEN: 'Aberta',
      CLOSED: 'Fechada',
      ALERT: 'Alerta',
    };

    return (
      <Badge
        label={labelMap[beach.status] || beach.status}
        variant={variantMap[beach.status] || 'neutral'}
        size="small"
      />
    );
  };

  const getWaterQualityIcon = () => {
    if (!beach.water_quality) return null;

    const iconMap: any = {
      PROPER: { name: 'water', color: theme.colors.success },
      IMPROPER: { name: 'water', color: theme.colors.error },
    };

    const config = iconMap[beach.water_quality];
    if (!config) return null;

    return <Ionicons name={config.name} size={16} color={config.color} />;
  };

  const getWaterQualityBadge = () => {
    if (!beach.water_quality) return null;

    const badgeConfig: any = {
      PROPER: { label: '✅ Própria', variant: 'success' },
      IMPROPER: { label: '❌ Imprópria', variant: 'error' },
    };

    const config = badgeConfig[beach.water_quality];
    if (!config) return null;

    return (
      <Badge
        label={config.label}
        variant={config.variant}
        size="small"
      />
    );
  };

  const getCrowdLevelIcon = () => {
    if (!beach.crowd_level) return null;

    const iconMap: any = {
      LOW: { name: 'people', color: theme.colors.crowdLow },
      MODERATE: { name: 'people', color: theme.colors.crowdModerate },
      HIGH: { name: 'people', color: theme.colors.crowdHigh },
      VERY_HIGH: { name: 'people', color: theme.colors.crowdVeryHigh },
    };

    const config = iconMap[beach.crowd_level];
    if (!config) return null;

    return <Ionicons name={config.name} size={16} color={config.color} />;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{beach.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.city}>{beach.city}</Text>
            </View>
          </View>
          
          {onToggleFavorite && (
            <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.badges}>
          {getStatusBadge()}
          {getWaterQualityBadge()}
          {/* Mostra lotação sempre que disponível */}
          {beach.crowd_level && (
            <CrowdBadge 
              level={beach.crowd_level} 
              size="small" 
              showLabel={false}
            />
          )}
          {beach.icp && beach.icp_rating && (
            <Badge 
              label={`ICP ${beach.icp.toFixed(0)} - ${beach.icp_rating}`} 
              variant={beach.icp >= 80 ? 'success' : beach.icp >= 60 ? 'info' : 'warning'} 
              size="small" 
            />
          )}
          {beach.distance_formatted ? (
            <Badge label={beach.distance_formatted} variant="info" size="small" />
          ) : showDistance && distance !== undefined ? (
            <Badge label={`${distance.toFixed(1)} km`} variant="info" size="small" />
          ) : null}
        </View>

        {/* Atividades disponíveis */}
        {beach.activities && beach.activities.length > 0 && (
          <View style={styles.activitiesContainer}>
            <ActivityBadges activities={beach.activities} maxVisible={4} size="small" />
          </View>
        )}

        <View style={styles.info}>
          {beach.temperature && (
            <View style={styles.infoItem}>
              <Ionicons name="thermometer" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{beach.temperature}°C</Text>
            </View>
          )}
          
          {beach.water_quality && (
            <View style={styles.infoItem}>
              {getWaterQualityIcon()}
              <Text style={styles.infoText}>Água</Text>
            </View>
          )}
          
          {beach.crowd_level && (
            <View style={styles.infoItem}>
              {getCrowdLevelIcon()}
              <Text style={styles.infoText}>Lotação</Text>
            </View>
          )}
          
          {beach.has_lifeguard && (
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
              <Text style={styles.infoText}>Salva-vidas</Text>
            </View>
          )}
          
          {showNavigation && beach.latitude && beach.longitude && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={(e) => {
                e.stopPropagation();
                openNavigationWithChoice(beach.latitude!, beach.longitude!, beach.name);
              }}
            >
              <Ionicons name="navigate" size={16} color={theme.colors.primary} />
              <Text style={styles.navigationText}>Como Chegar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  favoriteButton: {
    padding: theme.spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  activitiesContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  info: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
  },
  navigationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
