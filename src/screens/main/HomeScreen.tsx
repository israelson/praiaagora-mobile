import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import BeachCard from '../../components/beach/BeachCard';
import SkeletonBeachCard from '../../components/beach/SkeletonBeachCard';
import Card from '../../components/ui/Card';
import { useAutoCheckin } from '../../hooks/useAutoCheckin';
import { theme } from '../../theme';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { favorites, isFavorite, addFavorite, removeFavorite, loadFavorites } = useFavorites();
  const [nearbyBeaches, setNearbyBeaches] = useState([]);
  const [favoriteBeaches, setFavoriteBeaches] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);

  // ── Animations ──────────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const mapScale = useRef(new Animated.Value(1)).current;
  const exploreScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const pressIn = (scale: Animated.Value) =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start();

  const pressOut = (scale: Animated.Value) =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  // ────────────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    // When favorites (ids) change, fetch beach details for display
    const loadFavoriteDetails = async () => {
      try {
        if (!favorites || favorites.length === 0) {
          setFavoriteBeaches([]);
          return;
        }

        const results = await Promise.all(favorites.map((id) => api.getBeachById(id)));
        setFavoriteBeaches(results || []);
      } catch (error) {
        console.error('Error loading favorite beaches:', error);
        setFavoriteBeaches([]);
      }
    };

    loadFavoriteDetails();
  }, [favorites]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Pede permissão e localização uma única vez para evitar condição de corrida
      const granted = await requestLocationPermission();
      if (!granted) {
        console.log('Location permission not granted');
        setLoading(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      await Promise.all([
        loadNearbyBeaches(currentLocation.coords),
        loadRecommendations(currentLocation.coords),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyBeaches = async (coords: { latitude: number; longitude: number }) => {
    try {
      const response = await api.getNearbyBeaches(
        coords.latitude,
        coords.longitude,
        50
      );
      // A API pode retornar array direto ou { beaches: [] }
      const list = Array.isArray(response) ? response : response.beaches || [];
      setNearbyBeaches(list.slice(0, 5));
    } catch (error) {
      console.error('Error loading nearby beaches:', error);
    }
  };

  const loadRecommendations = async (coords: { latitude: number; longitude: number }) => {
    try {
      // Chamar API de recomendações com GPS
      const response = await api.getRecommendations(
        coords.latitude,
        coords.longitude,
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

  // Mostra explicação para o usuário e solicita permissão de localização.
  // Retorna true se a permissão foi concedida.
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      // If we already stored that permission was granted, skip prompt
      const stored = await AsyncStorage.getItem('location_permission_granted');
      if (stored === 'granted') return true;

      // If OS permission is already granted, persist and return
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === 'granted') {
        await AsyncStorage.setItem('location_permission_granted', 'granted');
        return true;
      }

      // If rationale was already shown once, request directly
      const rationaleShown = await AsyncStorage.getItem('location_permission_rationale_shown');
      if (rationaleShown === 'true') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          await AsyncStorage.setItem('location_permission_granted', 'granted');
        }
        return status === 'granted';
      }

      // First time: show rationale alert and record that we showed it
      return await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Permissão de Localização',
          'Permita o acesso à sua localização para mostrar praias próximas e recomendações personalizadas.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: async () => {
                try { await AsyncStorage.setItem('location_permission_rationale_shown', 'true'); } catch {}
                resolve(false);
              }
            },
            {
              text: 'Permitir',
              onPress: async () => {
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted') {
                    await AsyncStorage.setItem('location_permission_granted', 'granted');
                  }
                  await AsyncStorage.setItem('location_permission_rationale_shown', 'true');
                  resolve(status === 'granted');
                } catch (e) {
                  console.error('Erro ao solicitar permissão de localização', e);
                  try { await AsyncStorage.setItem('location_permission_rationale_shown', 'true'); } catch {}
                  resolve(false);
                }
              }
            }
          ],
          { cancelable: true }
        );
      });
    } catch (e) {
      console.error('Erro no fluxo de permissão de localização', e);
      return false;
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
      {/* Animated header */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        }}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.greeting}>Olá, {user?.full_name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Encontre a praia perfeita para você</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            {/* Mapa */}
            <Animated.View style={[styles.actionCardWrapper, { transform: [{ scale: mapScale }] }]}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Map')}
                onPressIn={() => pressIn(mapScale)}
                onPressOut={() => pressOut(mapScale)}
                activeOpacity={1}
              >
                <Ionicons name="map" size={32} color={theme.colors.primary} />
                <Text style={styles.actionText}>Mapa</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Buscar */}
            <Animated.View style={[styles.actionCardWrapper, { transform: [{ scale: exploreScale }] }]}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Explore')}
                onPressIn={() => pressIn(exploreScale)}
                onPressOut={() => pressOut(exploreScale)}
                activeOpacity={1}
              >
                <Ionicons name="search" size={32} color={theme.colors.primary} />
                <Text style={styles.actionText}>Buscar</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Favorite Beaches */}
        {loading ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Praias Favoritas</Text>
            {[1, 2].map((i) => <SkeletonBeachCard key={i} />)}
          </View>
        ) : favoriteBeaches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Praias Favoritas</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
                <Text style={styles.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {favoriteBeaches.map((beach: any) => (
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

        {/* Recommendations */}
        {loading ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendadas para Você</Text>
            <Text style={styles.sectionSubtitle}>Baseado na sua localização</Text>
            {[1, 2, 3].map((i) => <SkeletonBeachCard key={i} />)}
          </View>
        ) : recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recomendadas para Você</Text>
                <Text style={styles.sectionSubtitle}>Baseado na sua localização</Text>
              </View>
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
  actionCardWrapper: {
    flex: 1,
  },
  actionCard: {
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
