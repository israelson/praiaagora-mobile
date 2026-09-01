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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CrowdBadge } from '../../components/CrowdBadge';
import ActivityBadges from '../../components/ActivityBadges';
import { theme } from '../../theme';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getWindDirection, formatWindInfo } from '../../utils/weather';
import { openNavigationWithChoice, openUber } from '../../utils/navigation';
import { getStormAlert, buildOfficialStormAlert } from '../../utils/stormAlert';
import StormAlertBanner from '../../components/beach/StormAlertBanner';

const getTimeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  } catch {
    return 'agora';
  }
};

// A API não define uma enum fixa para partner.category/amenities (são strings
// livres), então casamos por palavra-chave em vez de valor exato.
const FEATURE_KEYWORDS: Record<string, string[]> = {
  lifeguard: ['lifeguard', 'salva-vidas', 'salvavidas', 'guarda-vidas', 'guardavidas'],
  parking: ['parking', 'estacionamento'],
  bathroom: ['bathroom', 'banheiro', 'restroom', 'toilet', 'sanitário', 'sanitario'],
  kiosk: ['kiosk', 'quiosque'],
  accessible: ['accessib', 'acessív', 'acessiv', 'wheelchair'],
};

function partnersForFeature(partners: any[], feature: keyof typeof FEATURE_KEYWORDS) {
  const keywords = FEATURE_KEYWORDS[feature];
  return partners.filter((p) => {
    const haystack = [p.category, p.partner_type, ...(Array.isArray(p.amenities) ? p.amenities : [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return keywords.some((kw) => haystack.includes(kw));
  });
}

function FeaturePartners({ partners, onPress }: { partners: any[]; onPress: (partnerId: string) => void }) {
  if (partners.length === 0) return null;
  return (
    <View style={styles.featurePartners}>
      {partners.map((partner) => (
        <TouchableOpacity
          key={partner.id}
          style={styles.featurePartnerChip}
          onPress={() => onPress(partner.id)}
        >
          <Text style={styles.featurePartnerChipText} numberOfLines={1}>
            {partner.display_name ?? partner.business_name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BeachDetailScreen({ route, navigation }: any) {
  const { beachId } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [beach, setBeach] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [crowdData, setCrowdData] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIcpBreakdown, setShowIcpBreakdown] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const isSameDay = (isoDate: string) => {
    try {
      const a = new Date(isoDate).toISOString().slice(0, 10);
      const b = new Date().toISOString().slice(0, 10);
      return a === b;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    loadBeachData();
  }, [beachId]);

  // Load persisted last check-in for this beach to show indicator in header
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
        setCheckedInToday(false);
      }
    };

    loadCheckin();
    const unsubscribe = navigation.addListener('focus', loadCheckin);
    return unsubscribe;
  }, [beachId, navigation]);

  const loadBeachData = async (isRefreshing: boolean = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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
      setPartners(partnersData.slice(0, 5));
    } catch (error) {
      console.error('Error loading beach data:', error);
      if (!isRefreshing) {
        Alert.alert('Erro', 'Não foi possível carregar os dados da praia');
        navigation.goBack();
      }
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadBeachData(true);
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite(beachId)) {
        Alert.alert(
          'Remover favorito',
          'Deseja realmente remover esta praia dos favoritos?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Remover',
              style: 'destructive',
              onPress: async () => {
                try {
                  await removeFavorite(beachId);
                } catch (err) {
                  Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
                }
              },
            },
          ]
        );
      } else {
        await addFavorite(beachId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
    }
  };

  const getCrowdColor = (level: string) => {
    const colorMap: any = {
      LOW: theme.colors.crowdLow,
      MODERATE: theme.colors.crowdModerate,
      HIGH: theme.colors.crowdHigh,
      VERY_HIGH: theme.colors.crowdVeryHigh,
    };
    return colorMap[level] || theme.colors.textSecondary;
  };

  const getCrowdLabel = (level: string) => {
    const labelMap: any = {
      LOW: 'Baixa',
      MODERATE: 'Moderada',
      HIGH: 'Alta',
      VERY_HIGH: 'Muito Alta',
    };
    return labelMap[level] || level;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!beach) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.beachName}>
              {beach.name}
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={theme.colors.textInverse} />
            <Text style={styles.cityName}>{beach.city}</Text>
          </View>

          {/* Botão Como Chegar e ações (Check-in / Favoritos) */}
          <View style={styles.navigationActionsRow}>
            {beach.latitude && beach.longitude && (
              <>
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={() => openNavigationWithChoice(beach.latitude, beach.longitude, beach.name)}
                >
                  <Ionicons name="navigate" size={20} color={theme.colors.textInverse} />
                  <Text style={styles.navigationButtonText}>Como Chegar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uberButton}
                  onPress={() => openUber(beach.latitude, beach.longitude, beach.name)}
                >
                  <Ionicons name="car-sport" size={20} color={theme.colors.textInverse} />
                  <Text style={styles.navigationButtonText}>Uber</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={[
                  styles.headerCheckinButton,
                  checkedInToday && { backgroundColor: theme.colors.success },
                ]}
                onPress={() => navigation.navigate('CheckIn', { beachId })}
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={checkedInToday ? theme.colors.textInverse : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.headerCheckinText,
                    checkedInToday && { color: theme.colors.textInverse },
                  ]}
                >
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

        {(() => {
          // Official INMET/Defesa Civil alert from the backend takes
          // priority; the client-side heuristic is only a fallback for
          // when the backend hasn't matched an alert to this municipality.
          const stormAlert =
            buildOfficialStormAlert(conditions?.conditions) ?? getStormAlert(conditions?.conditions);
          return stormAlert && <StormAlertBanner alert={stormAlert} />;
        })()}

        <View style={styles.content}>
          {/* ICP Score Card - Destaque (toque para ver composição) */}
          {conditions && conditions.icp && (
            <TouchableOpacity onPress={() => setShowIcpBreakdown((s) => !s)} activeOpacity={0.8}>
              <Card style={styles.icpCard}>
                <View style={styles.icpHeader}>
                  <Text style={styles.icpLabel}>Índice de Conforto Praial</Text>
                  <View style={styles.icpHeaderRight}>
                    <Badge
                      label={conditions.icp_rating}
                      variant={
                        conditions.icp >= 80 ? 'success' :
                        conditions.icp >= 60 ? 'info' : 'warning'
                      }
                    />
                    <Ionicons
                      name={showIcpBreakdown ? 'caret-up' : 'caret-down'}
                      size={18}
                      color={theme.colors.textSecondary}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </View>
                <View style={styles.icpScoreRow}>
                  <Text style={styles.icpScore}>{conditions.icp.toFixed(0)}</Text>
                  <Text style={styles.icpScoreUnit}>/100</Text>
                </View>
                <Text style={styles.icpDescription}>
                  {conditions.icp >= 80 ? 'Condições excelentes para aproveitar a praia!' :
                   conditions.icp >= 60 ? 'Boas condições para ir à praia' :
                   'Condições regulares, toque para ver a composição do índice'}
                </Text>
              </Card>
            </TouchableOpacity>
          )}

          {/* Condições Climáticas */}
          {conditions?.conditions && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Condições Atuais</Text>
              <View style={styles.conditionsGrid}>
                {conditions.conditions.air_temperature && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="thermometer-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.conditionValue}>{conditions.conditions.air_temperature.toFixed(1)}°C</Text>
                    <Text style={styles.conditionLabel}>Temperatura</Text>
                  </View>
                )}

                {conditions.conditions.water_temperature && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="water-outline" size={24} color={theme.colors.info} />
                    <Text style={styles.conditionValue}>{conditions.conditions.water_temperature.toFixed(1)}°C</Text>
                    <Text style={styles.conditionLabel}>Água</Text>
                  </View>
                )}

                {conditions.conditions.wind_speed && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="flag-outline" size={24} color={theme.colors.warning} />
                    <Text style={styles.conditionValue}>
                      {conditions.conditions.wind_direction 
                        ? formatWindInfo(conditions.conditions.wind_speed, conditions.conditions.wind_direction)
                        : `${conditions.conditions.wind_speed.toFixed(1)} km/h`
                      }
                    </Text>
                    <Text style={styles.conditionLabel}>Vento</Text>
                  </View>
                )}

                {conditions.conditions.uv_index !== null && conditions.conditions.uv_index !== undefined && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="sunny-outline" size={24} color={theme.colors.error} />
                    <Text style={styles.conditionValue}>{conditions.conditions.uv_index}</Text>
                    <Text style={styles.conditionLabel}>Índice UV</Text>
                  </View>
                )}

                {conditions.conditions.wave_height && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="analytics-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.conditionValue}>{conditions.conditions.wave_height.toFixed(1)}m</Text>
                    <Text style={styles.conditionLabel}>Ondas</Text>
                  </View>
                )}

                {conditions.conditions.humidity && (
                  <View style={styles.conditionItem}>
                    <Ionicons name="rainy-outline" size={24} color={theme.colors.info} />
                    <Text style={styles.conditionValue}>{conditions.conditions.humidity}%</Text>
                    <Text style={styles.conditionLabel}>Umidade</Text>
                  </View>
                )}
              </View>

              {conditions.conditions.weather_description && (
                <View style={styles.weatherDescription}>
                  <Ionicons name="cloud-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.weatherText}>{conditions.conditions.weather_description}</Text>
                </View>
              )}

              {conditions.conditions.recorded_at && (
                <Text style={styles.recordedAt}>
                  Atualizado em {format(new Date(conditions.conditions.recorded_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </Text>
              )}
            </Card>
          )}

          {/* Qualidade da Água */}
          {conditions?.conditions && (
            <Card style={styles.section}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="water" size={24} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Qualidade da Água</Text>
                </View>
              
              {conditions.conditions.water_quality ? (
                <View style={styles.waterQualityContainer}>
                  <Badge
                    label={
                      conditions.conditions.water_quality === 'PROPER' ? '✅ Própria' :
                      conditions.conditions.water_quality === 'IMPROPER' ? '❌ Imprópria' :
                      conditions.conditions.water_quality === 'EXCELLENT' ? 'Excelente' :
                      conditions.conditions.water_quality === 'GOOD' ? 'Boa' :
                      conditions.conditions.water_quality === 'REGULAR' ? 'Regular' : 'Imprópria'
                    }
                    variant={
                      conditions.conditions.water_quality === 'PROPER' || 
                      conditions.conditions.water_quality === 'EXCELLENT' || 
                      conditions.conditions.water_quality === 'GOOD' ? 'success' :
                      conditions.conditions.water_quality === 'REGULAR' ? 'warning' : 'error'
                    }
                  />
                  
                  <Text style={styles.waterQualityText}>
                    {conditions.conditions.water_quality === 'PROPER' || 
                     conditions.conditions.water_quality === 'EXCELLENT' || 
                     conditions.conditions.water_quality === 'GOOD' 
                      ? '🏖️ Água própria para banho' 
                      : conditions.conditions.water_quality === 'REGULAR'
                      ? '⚠️ Cuidado: qualidade regular'
                      : '🚫 Água imprópria - evite contato com o mar'}
                  </Text>
                
                {/* Info sobre atualização */}
                {conditions.conditions.water_quality_updated_at && (
                  <View style={styles.updateInfo}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.updateText}>
                      Atualizado em {format(new Date(conditions.conditions.water_quality_updated_at), "dd/MM/yyyy", { locale: ptBR })}
                    </Text>
                  </View>
                )}
                
                {/* Fonte dos dados */}
                {conditions.conditions.water_quality_points && (
                  <Text style={styles.sourceText}>
                    Fonte: IMA-SC ({conditions.conditions.water_quality_points} {conditions.conditions.water_quality_points === 1 ? 'ponto' : 'pontos'} de coleta)
                  </Text>
                )}
              </View>
              ) : (
                /* Mensagem quando NÃO há dados de monitoramento IMA-SC */
                <TouchableOpacity
                  style={styles.noDataContainer}
                  onPress={() =>
                    Alert.alert(
                      'Importante',
                      'A ausência de dados de monitoramento IMA‑SC não significa que a água esteja imprópria. Praias sem monitoramento podem ter boa qualidade, mas não há análises oficiais disponíveis.'
                    )
                  }
                >
                  <Ionicons name="information-circle-outline" size={48} color={theme.colors.info} />
                  <Text style={styles.noDataTitle}>Sem monitoramento IMA-SC</Text>
                  <Text style={styles.noDataText}>Toque para mais informações</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {/* ICP Breakdown shown in modal */}
          {conditions?.icp_breakdown && (
            <Modal
              visible={showIcpBreakdown}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowIcpBreakdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.sectionTitle}>Composição do ICP</Text>
                    <TouchableOpacity onPress={() => setShowIcpBreakdown(false)}>
                      <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView>
                    <Card style={[styles.section, { marginTop: 8 }]}> 
                      <Text style={styles.breakdownSubtitle}>
                        Veja como calculamos o Índice de Conforto Praial:
                      </Text>

                      <View style={styles.breakdownList}>
                        {/* Água: se não houver dados, mostramos 0 para refletir ausência de monitoramento */}
                        {conditions.icp_breakdown && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="water" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Qualidade da Água</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {(conditions.icp_breakdown.water_quality?.score ?? 0).toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${(conditions.icp_breakdown.water_quality?.score ?? 0)}%`,
                                    backgroundColor: (conditions.icp_breakdown.water_quality?.score ?? 0) >= 80 ? theme.colors.success : 
                                                   (conditions.icp_breakdown.water_quality?.score ?? 0) >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}

                        {conditions.icp_breakdown.temperature && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="thermometer" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Temperatura</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {conditions.icp_breakdown.temperature.score.toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${conditions.icp_breakdown.temperature.score}%`,
                                    backgroundColor: conditions.icp_breakdown.temperature.score >= 80 ? theme.colors.success : 
                                                   conditions.icp_breakdown.temperature.score >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}

                        {conditions.icp_breakdown.wind && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="flag" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Vento</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {conditions.icp_breakdown.wind.score.toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${conditions.icp_breakdown.wind.score}%`,
                                    backgroundColor: conditions.icp_breakdown.wind.score >= 80 ? theme.colors.success : 
                                                   conditions.icp_breakdown.wind.score >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}

                        {conditions.icp_breakdown.uv && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="sunny" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Índice UV</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {conditions.icp_breakdown.uv.score.toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${conditions.icp_breakdown.uv.score}%`,
                                    backgroundColor: conditions.icp_breakdown.uv.score >= 80 ? theme.colors.success : 
                                                   conditions.icp_breakdown.uv.score >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}

                        {conditions.icp_breakdown.precipitation && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="rainy" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Precipitação</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {conditions.icp_breakdown.precipitation.score.toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${conditions.icp_breakdown.precipitation.score}%`,
                                    backgroundColor: conditions.icp_breakdown.precipitation.score >= 80 ? theme.colors.success : 
                                                   conditions.icp_breakdown.precipitation.score >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}

                        {conditions.icp_breakdown.crowd && (
                          <View style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                              <View style={styles.breakdownLabelContainer}>
                                <Ionicons name="people" size={18} color={theme.colors.primary} />
                                <Text style={styles.breakdownLabel}>Lotação</Text>
                              </View>
                              <Text style={styles.breakdownScore}>
                                {conditions.icp_breakdown.crowd.score.toFixed(0)}
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${conditions.icp_breakdown.crowd.score}%`,
                                    backgroundColor: conditions.icp_breakdown.crowd.score >= 80 ? theme.colors.success : 
                                                   conditions.icp_breakdown.crowd.score >= 60 ? theme.colors.info : 
                                                   theme.colors.warning
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    </Card>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}

          {/* Quick Info Cards */}
          <View style={styles.quickInfo}>
            {beach.temperature && (
              <Card style={styles.infoCard} variant="outlined">
                <Ionicons name="thermometer" size={28} color={theme.colors.primary} />
                <Text style={styles.infoValue}>{beach.temperature}°C</Text>
                <Text style={styles.infoLabel}>Temperatura</Text>
              </Card>
            )}

            {beach.water_quality && (
              <Card style={styles.infoCard} variant="outlined">
                <Ionicons name="water" size={28} color={theme.colors.info} />
                <Text style={styles.infoValue}>
                  {beach.water_quality === 'EXCELLENT' ? 'Ótima' :
                   beach.water_quality === 'GOOD' ? 'Boa' :
                   beach.water_quality === 'REGULAR' ? 'Regular' : 'Ruim'}
                </Text>
                <Text style={styles.infoLabel}>Balneabilidade</Text>
              </Card>
            )}

            {beach.crowd_level && (
              <Card style={styles.infoCard} variant="outlined">
                <Ionicons
                  name="people"
                  size={28}
                  color={getCrowdColor(beach.crowd_level)}
                />
                <Text style={styles.infoValue}>
                  {getCrowdLabel(beach.crowd_level)}
                </Text>
                <Text style={styles.infoLabel}>Lotação</Text>
              </Card>
            )}
          </View>

          {/* Crowd Level - mostra sempre, mas deixa claro que é estimativa */}
          {crowdData && crowdData.confidence_score > 0 && (
            <Card style={styles.section}>
              <View style={styles.crowdHeader}>
                <Text style={styles.sectionTitle}>Lotação</Text>
                <TouchableOpacity
                  style={styles.estimativeBadge}
                  onPress={() =>
                    Alert.alert(
                      'Estimativa de lotação',
                      'Atualizado ' + getTimeAgo(crowdData.last_updated || crowdData.calculated_at) + '\n\n' +
                        'Esta estimativa é calculada com base em fontes como check-ins, fluxo de trânsito e padrões históricos. Pode não refletir a lotação real no momento.'
                    )
                  }
                >
                  <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.estimativeText}>Estimativa</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.crowdContainer}>
                <CrowdBadge 
                  level={crowdData.crowd_level} 
                  size="large" 
                  showLabel={true}
                />
              </View>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <View style={styles.secondaryActionsSingle}>
              <Button
                title="Ver no Mapa"
                variant="outline"
                onPress={() => navigation.navigate('Map', { beachId })}
                style={{ flex: 1 }}
              />
            </View>
          </View>

          {/* Atividades disponíveis */}
          {beach.activities && beach.activities.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Atividades e Esportes</Text>
              <ActivityBadges activities={beach.activities} maxVisible={10} size="medium" />
            </Card>
          )}

          {/* Features */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Infraestrutura</Text>
            <View style={styles.features}>
              {beach.has_lifeguard && (
                <View style={styles.featureWrapper}>
                  <View style={styles.feature}>
                    <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>Salva-vidas</Text>
                  </View>
                  <FeaturePartners
                    partners={partnersForFeature(partners, 'lifeguard')}
                    onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
                  />
                </View>
              )}
              {beach.has_parking && (
                <View style={styles.featureWrapper}>
                  <View style={styles.feature}>
                    <Ionicons name="car" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>Estacionamento</Text>
                  </View>
                  <FeaturePartners
                    partners={partnersForFeature(partners, 'parking')}
                    onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
                  />
                </View>
              )}
              {beach.has_bathroom && (
                <View style={styles.featureWrapper}>
                  <View style={styles.feature}>
                    <Ionicons name="fitness" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>Banheiros</Text>
                  </View>
                  <FeaturePartners
                    partners={partnersForFeature(partners, 'bathroom')}
                    onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
                  />
                </View>
              )}
              {beach.has_kiosk && (
                <View style={styles.featureWrapper}>
                  <View style={styles.feature}>
                    <Ionicons name="storefront" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>Quiosques</Text>
                  </View>
                  <FeaturePartners
                    partners={partnersForFeature(partners, 'kiosk')}
                    onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
                  />
                </View>
              )}
              {beach.accessible && (
                <View style={styles.featureWrapper}>
                  <View style={styles.feature}>
                    <Ionicons name="accessibility" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>Acessível</Text>
                  </View>
                  <FeaturePartners
                    partners={partnersForFeature(partners, 'accessible')}
                    onPress={(id) => navigation.navigate('PartnerDetail', { partnerId: id })}
                  />
                </View>
              )}
            </View>
          </Card>

          {/* Nearby Partners */}

          {/* Nearby Partners */}
          {partners.length > 0 && (
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Parceiros Próximos</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              
              {partners.map((partner: any) => (
                <TouchableOpacity
                  key={partner.id}
                  style={styles.partnerItem}
                  onPress={() => navigation.navigate('PartnerDetail', { partnerId: partner.id })}
                >
                  <View style={styles.partnerIcon}>
                    <Ionicons
                      name={
                        partner.category === 'HOTEL' ? 'bed' :
                        partner.category === 'RESTAURANT' ? 'restaurant' :
                        partner.category === 'SURF_SCHOOL' ? 'fitness' : 'business'
                      }
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <Text style={styles.partnerDistance}>
                      {partner.distance ? `${partner.distance.toFixed(1)} km` : 'Próximo'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  beachName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
    flexShrink: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  navigationButtonText: {
    color: theme.colors.textInverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  uberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  cityName: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textInverse,
    opacity: 0.9,
  },
  content: {
    padding: theme.spacing.md,
  },
  quickInfo: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  infoValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    marginBottom: theme.spacing.lg,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  secondaryActionsSingle: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  seeAll: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  featureWrapper: {
    width: '45%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  featurePartners: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    marginLeft: 28,
  },
  featurePartnerChip: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
  },
  featurePartnerChipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  predictionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  confidenceText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  partnerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  partnerDistance: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  // Estilos para ICP Card
  icpCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  icpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  icpLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textInverse,
    fontWeight: theme.fontWeight.semibold,
  },
  icpScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: theme.spacing.sm,
  },
  icpScore: {
    fontSize: 64,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    lineHeight: 64,
  },
  icpScoreUnit: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textInverse,
    opacity: 0.85,
    marginLeft: 4,
    marginBottom: 10,
  },
  icpDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  favoriteButton: {
    padding: 6,
    borderRadius: theme.borderRadius.full,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  navigationActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    justifyContent: 'flex-start',
  },
  headerCheckinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.textInverse,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  headerCheckinText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  // Estilos para Condições Grid
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  conditionItem: {
    width: '30%',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  conditionValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  conditionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  weatherDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  weatherText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  recordedAt: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  // Estilos para Qualidade da Água
  waterQualityContainer: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  waterQualityText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  updateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  sourceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Estilos para quando NÃO há dados de balneabilidade
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  noDataTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  noDataNote: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#E3F2FD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  noDataNoteHighlight: {
    fontWeight: theme.fontWeight.bold,
  },
  // Estilos para ICP Breakdown
  breakdownSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  breakdownList: {
    gap: theme.spacing.md,
  },
  breakdownItem: {
    gap: theme.spacing.xs,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  icpHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  breakdownLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  breakdownScore: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  crowdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  crowdDetails: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  crowdDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  crowdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  estimativeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  estimativeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  crowdDisclaimerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  confidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  confidenceWarningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.medium,
  },
  breakdownBarContainer: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
});
