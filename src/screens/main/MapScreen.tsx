import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';
import { theme } from '../../theme';

export default function MapScreen({ route, navigation }: any) {
  const { beachId } = route.params || {};
  const [beach, setBeach] = useState<any>(null);
  const [beaches, setBeaches] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation.coords);
      }

      // Load all beaches (for map markers). API caps limit at 500; if that ever
      // changes and rejects it, fall back to the default page instead of failing.
      let all: any = null;
      try {
        all = await api.getBeaches({ limit: 500 });
      } catch (err: any) {
        if (err?.response?.status === 422) {
          console.warn('getBeaches 500 rejected, retrying without params');
          try {
            all = await api.getBeaches();
          } catch (e) {
            throw e;
          }
        } else {
          throw err;
        }
      }

      // Support APIs that return array or { results: [] }
      const list = Array.isArray(all) ? all : (all?.results || all || []);
      const filtered = (list || []).filter((b: any) => b?.latitude && b?.longitude);
      setBeaches(filtered);

      // If a specific beach was requested, also load it (to center/highlight)
      if (beachId) {
        const beachData = await api.getBeachById(beachId);
        setBeach(beachData);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
      Alert.alert('Erro', 'Não foi possível carregar o mapa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Default initial region if fitToCoordinates is not yet called
  const initialRegion = beach
    ? {
        latitude: beach.latitude,
        longitude: beach.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }
    : {
        // Generic Brazil-wide view; onMapReady's fitToCoordinates zooms to the
        // loaded beaches right after, this is just the fallback if that fails.
        latitude: -14.235,
        longitude: -51.9253,
        latitudeDelta: 40,
        longitudeDelta: 40,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={(r) => { mapRef.current = r; }}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onMapReady={() => {
          // Fit map to show all beaches if available
          try {
            if (mapRef.current && beaches.length > 0) {
              const coords: LatLng[] = beaches.map((b) => ({ latitude: b.latitude, longitude: b.longitude }));
              if (coords.length === 1) {
                mapRef.current.animateToRegion({
                  latitude: coords[0].latitude,
                  longitude: coords[0].longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }, 500);
              } else {
                mapRef.current.fitToCoordinates(coords, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                });
              }
            }
          } catch (e) {
            console.warn('fitToCoordinates failed', e);
          }
        }}
      >
        {beaches.map((b: any) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            title={b.name}
            description={b.city}
            pinColor={beach && b.id === beach.id ? theme.colors.primary : undefined}
            onPress={() => navigation.navigate('BeachDetail', { beachId: b.id })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
});
