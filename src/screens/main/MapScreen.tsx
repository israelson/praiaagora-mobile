import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';
import { theme } from '../../theme';

export default function MapScreen({ route }: any) {
  const { beachId } = route.params;
  const [beach, setBeach] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        latitude: -27.5954,
        longitude: -48.548,
        latitudeDelta: 2,
        longitudeDelta: 2,
      };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {beach && (
          <Marker
            coordinate={{
              latitude: beach.latitude,
              longitude: beach.longitude,
            }}
            title={beach.name}
            description={beach.city}
            pinColor={theme.colors.primary}
          />
        )}
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
