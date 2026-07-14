import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
// Button removed — check-in is performed when selecting a crowd level
import { notifyCheckinSuccess } from '../../services/notifications';
import { theme } from '../../theme';

const CROWD_LEVELS = [
  { value: 'LOW', label: 'Baixa', icon: 'people', color: theme.colors.crowdLow },
  { value: 'MEDIUM', label: 'Moderada', icon: 'people', color: theme.colors.crowdModerate },
  { value: 'HIGH', label: 'Alta', icon: 'people', color: theme.colors.crowdHigh },
  { value: 'VERY_HIGH', label: 'Muito Alta', icon: 'people', color: theme.colors.crowdVeryHigh },
];

export default function CheckInScreen({ route, navigation }: any) {
  const { beachId, beachName } = route.params;
  const [selectedCrowdLevel, setSelectedCrowdLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const isSameDay = (isoDate: string) => {
    try {
      const a = new Date(isoDate).toISOString().slice(0, 10);
      const b = new Date().toISOString().slice(0, 10);
      return a === b;
    } catch (e) {
      return false;
    }
  };

  // Load last check-in for this beach and lock if it's from today
  React.useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(`last_checkin:${beachId}`);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj?.date && obj?.level && isSameDay(obj.date)) {
            setSelectedCrowdLevel(obj.level);
            setLocked(true);
          }
        }
      } catch (e) {
        console.error('Erro lendo último check-in', e);
      }
    };
    load();
  }, [beachId]);

  // Load beach coordinates to verify proximity before allowing check-in
  const [beachCoords, setBeachCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);
  React.useEffect(() => {
    let mounted = true;
    const loadBeach = async () => {
      try {
        const b = await api.getBeachById(beachId);
        if (mounted && b?.latitude && b?.longitude) {
          setBeachCoords({ latitude: b.latitude, longitude: b.longitude });
        }
      } catch (e) {
        console.error('Erro carregando praia para verificação de proximidade', e);
      }
    };
    loadBeach();
    return () => { mounted = false; };
  }, [beachId]);

  const handleCheckIn = async () => {
    // function removed — check-in is performed immediately when a level is tapped
  };

  const handleSelectAndCheckIn = async (level: string) => {
    if (locked) {
      Alert.alert('Check-in já registrado', 'Você já registrou a lotação hoje e só pode alterar amanhã.');
      return;
    }

    // If we have beach coords, check device proximity first
    if (beachCoords) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão de localização necessária', 'Permita acesso à localização para confirmar que você está próximo da praia.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const distance = calculateDistanceMeters(
          loc.coords.latitude,
          loc.coords.longitude,
          beachCoords.latitude,
          beachCoords.longitude
        );

        if (distance > 1000) {
          Alert.alert('Muito longe', `Sua localização está a aproximadamente ${Math.round(distance)}m da praia. É necessário estar a até 1km para registrar o check-in.`);
          return;
        }
      } catch (e) {
        console.error('Erro ao verificar localização:', e);
        Alert.alert('Erro', 'Não foi possível verificar sua posição. Tente novamente.');
        return;
      }
    } else {
      // If beach coords are missing, block to avoid bogus check-ins
      Alert.alert('Localização da praia desconhecida', 'Não é possível confirmar proximidade desta praia. Check-in não permitido.');
      return;
    }

    setSelectedCrowdLevel(level);
    setLoading(true);
    try {
      await api.createCheckIn(beachId, {
        crowd_level: level as any,
      });

      // Persist last check-in for today
      const today = new Date().toISOString();
      await AsyncStorage.setItem(`last_checkin:${beachId}`, JSON.stringify({ level, date: today }));
      setLocked(true);

      // Fire local notification (silent if permissions not granted)
      if (beachName) {
        notifyCheckinSuccess(beachName).catch(() => {});
      }

      Alert.alert('Check-in Realizado!', 'Obrigado por contribuir com a comunidade Beachly 🌊');
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Não foi possível realizar o check-in';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Haversine formula to calculate meters between two lat/lon
  const calculateDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.infoCard} variant="filled">
          <Ionicons name="information-circle" size={32} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Ajude outros usuários informando como está a lotação da praia agora
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Nível de Lotação *</Text>
        <View style={styles.crowdLevels}>
          {CROWD_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.crowdLevelCard,
                selectedCrowdLevel === level.value && {
                  borderColor: level.color,
                  backgroundColor: `${level.color}10`,
                },
              ]}
              onPress={() => handleSelectAndCheckIn(level.value)}
              disabled={locked && selectedCrowdLevel !== level.value}
            >
              <Ionicons
                name={level.icon as any}
                size={32}
                color={selectedCrowdLevel === level.value ? level.color : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.crowdLevelLabel,
                  selectedCrowdLevel === level.value && {
                    color: level.color,
                    fontWeight: theme.fontWeight.bold,
                  },
                  locked && selectedCrowdLevel !== level.value && { opacity: 0.5 },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Check-in is triggered when selecting a crowd level; button removed */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  crowdLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  crowdLevelCard: {
    width: '47%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  crowdLevelLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xl,
  },
});
