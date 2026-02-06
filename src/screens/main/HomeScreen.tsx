import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import BeachCard from '../../components/beach/BeachCard';
import Card from '../../components/ui/Card';
import { useAutoCheckin } from '../../hooks/useAutoCheckin';
import { theme } from '../../theme';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { favorites, isFavorite, addFavorite, removeFavorite, loadFavorites } = useFavorites();
  const [nearbyBeaches, setNearbyBeaches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);

  // Auto check-in hook - monitors nearby beaches automatically
  const { isChecking, lastCheckin, error: checkinError } = useAutoCheckin(nearbyBeaches, {
    enabled: true,
    checkInterval: 5 * 60 * 1000, // 5 minutes
    maxDistance: 500, // 500 meters
  });

  useEffect(() => {
    loadData();
    loadFavorites();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNearbyBeaches(),
        loadRecommendations(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyBeaches = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);

      const response = await api.getNearbyBeaches(
        location.coords.latitude,
        location.coords.longitude,
        50
      );
      setNearbyBeaches(response.beaches.slice(0, 5));
    } catch (error) {
      console.error('Error loading nearby beaches:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted for recommendations');
        return;
      }

      // Obter localização atual
      const currentLocation = await Location.getCurrentPositionAsync({});
      
      // Chamar API de recomendações com GPS
      const response = await api.getRecommendations(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        30 // raio de 30km
      );
      
      // Extrair array de recomendações (novo formato da API)
      const recommendationsArray = response.recommendations || response || [];
      
      // Mapear dados do backend para formato esperado pelo BeachCard
      const mappedRecommendations = recommendationsArray.map((rec: any) => ({
        id: rec.beach_id || rec.id,
        name: rec.beach_name || rec.name,
        city: rec.beach_city || rec.city,
        state: rec.beach_state || rec.state,
        latitude: rec.beach_latitude || rec.latitude,
        longitude: rec.beach_longitude || rec.longitude,
        distance_km: rec.distance_km,
        distance_formatted: rec.distance_formatted,
        icp: rec.icp,
        icp_rating: rec.icp_rating,
        recommendation_score: rec.recommendation_score,
        temperature: rec.conditions?.air_temperature || rec.conditions?.temperature,
        water_quality: rec.conditions?.water_quality,
        crowd_level: rec.conditions?.crowd_level,
        weather_description: rec.conditions?.weather_description,
      }));
      
      setRecommendations(mappedRecommendations.slice(0, 5));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleToggleFavorite = async (beachId: string) => {
    try {
      if (isFavorite(beachId)) {
        await removeFavorite(beachId);
      } else {
        await addFavorite(beachId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
    }
  };

  const calculateDistance = (beachLat: number, beachLon: number) => {
    if (!location) return 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = (beachLat - location.latitude) * Math.PI / 180;
    const dLon = (beachLon - location.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.latitude * Math.PI / 180) *
        Math.cos(beachLat * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Olá, {user?.full_name?.split(' ')[0]}! 👋</Text>
        <Text style={styles.subtitle}>Encontre a praia perfeita para você</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Map')}
            >
              <Ionicons name="map" size={32} color={theme.colors.primary} />
              <Text style={styles.actionText}>Mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Explore')}
            >
              <Ionicons name="search" size={32} color={theme.colors.primary} />
              <Text style={styles.actionText}>Buscar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Favorites')}
            >
              <Ionicons name="heart" size={32} color={theme.colors.primary} />
              <Text style={styles.actionText}>Favoritas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Beaches */}
        {nearbyBeaches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Praias Próximas</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {nearbyBeaches.map((beach: any) => (
              <BeachCard
                key={beach.id}
                beach={beach}
                onPress={() => navigation.navigate('BeachDetail', { beachId: beach.id })}
                isFavorite={isFavorite(beach.id)}
                onToggleFavorite={() => handleToggleFavorite(beach.id)}
                showDistance
                distance={calculateDistance(beach.latitude, beach.longitude)}
              />
            ))}
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recomendadas para Você</Text>
              <Text style={styles.sectionSubtitle}>Baseado na sua localização</Text>
            </View>

            {recommendations.map((beach: any) => (
              <BeachCard
                key={beach.id}
                beach={beach}
                onPress={() => navigation.navigate('BeachDetail', { beachId: beach.id })}
                isFavorite={isFavorite(beach.id)}
                onToggleFavorite={() => handleToggleFavorite(beach.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  seeAll: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
});
