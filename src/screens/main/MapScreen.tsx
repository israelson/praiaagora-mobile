import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
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

  // Location resolves asynchronously and may arrive after the map has
  // already mounted (and fallen back to fitting all beaches) — recenter
  // on the user's region as soon as it's available.
  useEffect(() => {
    if (loading || !mapRef.current || beach || !location) return;
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    }, 500);
  }, [location, loading, beach]);

  const loadData = async () => {
    // Location and beaches don't depend on each other — run them in parallel
    // instead of waiting on a (sometimes slow) GPS fix before even asking
    // the API for beaches.
    const locationTask = (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // Cached fix first so we can center on the user's region right away;
        // refine with a fresh fix in the background once it resolves.
        const last = await Location.getLastKnownPositionAsync();
        if (last) setLocation(last.coords);

        const fresh = await Location.getCurrentPositionAsync({});
        setLocation(fresh.coords);
      } catch (e) {
        console.warn('Location error', e);
      }
    })();

    const beachesTask = (async () => {
      try {
        // Load all beaches (for map markers). API caps limit at 500; if that
        // ever changes and rejects it, fall back to the default page instead
        // of failing.
        let all: any = null;
        try {
          all = await api.getBeaches({ limit: 500 });
        } catch (err: any) {
          if (err?.response?.status === 422) {
            console.warn('getBeaches 500 rejected, retrying without params');
            all = await api.getBeaches();
          } else {
            throw err;
          }
        }

        // Support APIs that return array or { results: [] }
        const list = Array.isArray(all) ? all : (all?.results || all || []);
        const filtered = (list || []).filter((b: any) => b?.latitude && b?.longitude);
        setBeaches(filtered);
      } catch (error) {
        console.error('Error loading beaches:', error);
        Alert.alert('Erro', 'Não foi possível carregar o mapa');
      }
    })();

    // If a specific beach was requested, also load it (to center/highlight)
    const beachTask = beachId
      ? api.getBeachById(beachId).then(setBeach).catch((e) => console.error('Error loading beach', e))
      : Promise.resolve();

    // Don't block the spinner on the GPS fix — only on the data needed to
    // render markers. Location arrives async and re-centers the map below.
    await Promise.all([beachesTask, beachTask]);
    setLoading(false);
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
          try {
            if (!mapRef.current) return;

            // A specific beach was requested: zoom straight to it and leave
            // the other markers visible in the background, don't fit to all.
            if (beach) {
              mapRef.current.animateToRegion({
                latitude: beach.latitude,
                longitude: beach.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
              return;
            }

            // No specific beach: prefer the user's own region over fitting
            // to every beach in Brazil (slower and not what's relevant here).
            if (location) {
              mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
              }, 500);
              return;
            }

            // No location yet either (denied or still resolving): fall back
            // to fitting all beaches so the map isn't stuck on a blank view.
            if (beaches.length > 0) {
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
            pinColor={beach && b.id === beach.id ? theme.colors.primary : undefined}
          >
            <Callout onPress={() => navigation.navigate('BeachDetail', { beachId: b.id })}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{b.name}</Text>
                {!!b.city && <Text style={styles.calloutSubtitle}>{b.city}</Text>}
              </View>
            </Callout>
          </Marker>
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
  calloutContainer: {
    minWidth: 140,
    padding: 10,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius?.md ?? 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
