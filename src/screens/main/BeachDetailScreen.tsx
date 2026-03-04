import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ActivityBadges from '../../components/ActivityBadges';
import IcpCard from '../../components/beach/IcpCard';
import ConditionsSection from '../../components/beach/ConditionsSection';
import WaterQualitySection from '../../components/beach/WaterQualitySection';
import CrowdSection from '../../components/beach/CrowdSection';
import PartnersSection from '../../components/beach/PartnersSection';
import { theme } from '../../theme';
import { openNavigationWithChoice } from '../../utils/navigation';

export default function BeachDetailScreen({ route, navigation }: any) {
  const { beachId } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [beach, setBeach] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [crowdData, setCrowdData] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const isSameDay = (isoDate: string) => {
    try {
      const a = new Date(isoDate).toISOString().slice(0, 10);
      const b = new Date().toISOString().slice(0, 10);
      return a === b;
    } catch {
      return false;
    }
  };

  useEffect(() => { loadBeachData(); }, [beachId]);

  useEffect(() => {
    const loadCheckin = async () => {
      try {
        const raw = await AsyncStorage.getItem(`last_checkin:${beachId}`);
        if (raw) {
          const obj = JSON.parse(raw);
          setCheckedInToday(!!(obj?.date && isSameDay(obj.date)));
        } else {
          setCheckedInToday(false);
        }
      } catch (e) {
        console.error('Erro lendo último check-in', e);
      }
    };
    loadCheckin();
    const unsubscribe = navigation.addListener('focus', loadCheckin);
    return unsubscribe;
  }, [beachId, navigation]);

  const loadBeachData = async (isRefreshing = false) => {
    isRefreshing ? setRefreshing(true) : setLoading(true);
    try {
      const [beachData, conditionsData, crowdResponse, partnersData] = await Promise.all([
        api.getBeachById(beachId),
        api.getBeachConditions(beachId).catch(() => null),
        api.getCrowdLevel(beachId).catch(() => null),
        api.getNearbyPartners(beachId).catch(() => []),
      ]);
      setBeach(beachData);
      setConditions(conditionsData);
      setCrowdData(crowdResponse);
      setPartners(Array.isArray(partnersData) ? partnersData.slice(0, 5) : []);
    } catch (error) {
      console.error('Error loading beach data:', error);
      if (!isRefreshing) {
        Alert.alert('Erro', 'Não foi possível carregar os dados da praia');
        navigation.goBack();
      }
    } finally {
      isRefreshing ? setRefreshing(false) : setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite(beachId)) {
        Alert.alert('Remover favorito', 'Deseja realmente remover esta praia dos favoritos?', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try { await removeFavorite(beachId); }
              catch { Alert.alert('Erro', 'Não foi possível atualizar os favoritos'); }
            },
          },
        ]);
      } else {
        await addFavorite(beachId);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  if (!beach) return null;

  const cond = conditions?.conditions ?? null;

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBeachData(true)} />}>

        {/* ── Header ── */}
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
          <Text style={styles.beachName}>{beach.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={theme.colors.textInverse} />
            <Text style={styles.cityName}>{beach.city}</Text>
          </View>
          <View style={styles.actionsRow}>
            {beach.latitude && beach.longitude && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigationWithChoice(beach.latitude, beach.longitude, beach.name)}
              >
                <Ionicons name="navigate" size={20} color={theme.colors.textInverse} />
                <Text style={styles.navButtonText}>Como Chegar</Text>
              </TouchableOpacity>
            )}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.checkinButton, checkedInToday && { backgroundColor: theme.colors.success }]}
                onPress={() => navigation.navigate('CheckIn', { beachId })}
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={checkedInToday ? theme.colors.textInverse : theme.colors.primary}
                />
                <Text style={[styles.checkinText, checkedInToday && { color: theme.colors.textInverse }]}>
                  Check-in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Ionicons
                  name={isFavorite(beachId) ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFavorite(beachId) ? theme.colors.error : theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* ── ICP ── */}
          {conditions?.icp != null && (
            <IcpCard
              icp={conditions.icp}
              icp_rating={conditions.icp_rating}
              icp_breakdown={conditions.icp_breakdown}
            />
          )}

          {/* ── Condições Climáticas ── */}
          {cond && <ConditionsSection conditions={cond} />}

          {/* ── Qualidade da Água ── */}
          {cond && (
            <WaterQualitySection
              waterQuality={cond.water_quality}
              waterQualityUpdatedAt={cond.water_quality_updated_at}
              waterQualityPoints={cond.water_quality_points}
            />
          )}

          {/* ── Lotação ── */}
          {crowdData && <CrowdSection crowdData={crowdData} />}

          {/* ── Ações ── */}
          <View style={styles.actions}>
            <Button
              title="Ver no Mapa"
              variant="outline"
              onPress={() => navigation.navigate('Map', { beachId })}
              fullWidth
            />
          </View>

          {/* ── Atividades ── */}
          {beach.activities && beach.activities.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Atividades e Esportes</Text>
              <ActivityBadges activities={beach.activities} maxVisible={10} size="medium" />
            </Card>
          )}

          {/* ── Infraestrutura ── */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Infraestrutura</Text>
            <View style={styles.features}>
              {beach.has_lifeguard && <InfraItem icon="shield-checkmark" label="Salva-vidas" />}
              {beach.has_parking && <InfraItem icon="car" label="Estacionamento" />}
              {beach.has_bathroom && <InfraItem icon="fitness" label="Banheiros" />}
              {beach.has_kiosk && <InfraItem icon="storefront" label="Quiosques" />}
              {beach.accessible && <InfraItem icon="accessibility" label="Acessível" />}
              {beach.parking_available && !beach.has_parking && <InfraItem icon="car" label="Estacionamento" />}
            </View>
          </Card>

          {/* ── Parceiros ── */}
          <PartnersSection
            partners={partners}
            onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
          />

        </View>
      </ScrollView>
    </View>
  );
}

function InfraItem({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={20} color={theme.colors.success} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxl },
  beachName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
    flexShrink: 1,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: theme.spacing.md },
  cityName: { fontSize: theme.fontSize.lg, color: theme.colors.textInverse, opacity: 0.9 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  navButtonText: { color: theme.colors.textInverse, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginLeft: 'auto' },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.textInverse,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  checkinText: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  favoriteButton: { padding: 6, borderRadius: theme.borderRadius.full },
  content: { padding: theme.spacing.md },
  section: { marginBottom: theme.spacing.md },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actions: { marginBottom: theme.spacing.lg },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, width: '45%' },
  featureText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
});
