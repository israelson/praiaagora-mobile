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
import { openNavigationWithChoice } from '../../utils/navigation';

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

export default function BeachDetailScreen({ route, navigation }: any) {
  const { beachId } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [beach, setBeach] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [crowdData, setCrowdData] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBeachData();
  }, [beachId]);

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
        await removeFavorite(beachId);
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
        {/* Header with gradient */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.header}
        >
          <Text style={styles.beachName}>{beach.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={theme.colors.textInverse} />
            <Text style={styles.cityName}>{beach.city}</Text>
          </View>
          
          {/* Botão Como Chegar */}
          {beach.latitude && beach.longitude && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => openNavigationWithChoice(beach.latitude, beach.longitude, beach.name)}
            >
              <Ionicons name="navigate" size={20} color={theme.colors.textInverse} />
              <Text style={styles.navigationButtonText}>Como Chegar</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.content}>
          {/* ICP Score Card - Destaque */}
          {conditions && conditions.icp && (
            <Card style={styles.icpCard}>
              <View style={styles.icpHeader}>
                <Text style={styles.icpLabel}>Índice de Conforto Praial</Text>
                <Badge
                  label={conditions.icp_rating}
                  variant={
                    conditions.icp >= 80 ? 'success' :
                    conditions.icp >= 60 ? 'info' : 'warning'
                  }
                />
              </View>
              <Text style={styles.icpScore}>{conditions.icp.toFixed(0)}</Text>
              <Text style={styles.icpDescription}>
                {conditions.icp >= 80 ? 'Condições excelentes para aproveitar a praia!' :
                 conditions.icp >= 60 ? 'Boas condições para ir à praia' :
                 'Condições regulares, verifique os detalhes abaixo'}
              </Text>
            </Card>
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

          {/* Qualidade da Água (Balneabilidade) */}
          {conditions?.conditions && (
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="water" size={24} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Balneabilidade</Text>
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
                /* Mensagem quando NÃO há dados de balneabilidade */
                <View style={styles.noDataContainer}>
                  <Ionicons name="information-circle-outline" size={48} color={theme.colors.info} />
                  <Text style={styles.noDataTitle}>Sem monitoramento IMA-SC</Text>
                  <Text style={styles.noDataText}>
                    Esta praia não possui dados de balneabilidade porque não está incluída no programa de monitoramento do Instituto do Meio Ambiente de Santa Catarina (IMA-SC).
                  </Text>
                  <Text style={styles.noDataNote}>
                    ℹ️ <Text style={styles.noDataNoteHighlight}>Importante:</Text> A ausência de dados não significa que a água esteja imprópria. Praias sem monitoramento podem ter boa qualidade, mas não há análises oficiais disponíveis.
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* ICP Breakdown */}
          {conditions?.icp_breakdown && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Composição do ICP</Text>
              <Text style={styles.breakdownSubtitle}>
                Veja como calculamos o Índice de Conforto Praial:
              </Text>

              <View style={styles.breakdownList}>
                {conditions.icp_breakdown.water_quality && (
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <View style={styles.breakdownLabelContainer}>
                        <Ionicons name="water" size={18} color={theme.colors.primary} />
                        <Text style={styles.breakdownLabel}>Qualidade da Água</Text>
                      </View>
                      <Text style={styles.breakdownScore}>
                        {conditions.icp_breakdown.water_quality.score.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.breakdownBarContainer}>
                      <View 
                        style={[
                          styles.breakdownBar, 
                          { 
                            width: `${conditions.icp_breakdown.water_quality.score}%`,
                            backgroundColor: conditions.icp_breakdown.water_quality.score >= 80 ? theme.colors.success : 
                                           conditions.icp_breakdown.water_quality.score >= 60 ? theme.colors.info : 
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

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Fazer Check-in"
              onPress={() => navigation.navigate('CheckIn', { beachId })}
              fullWidth
            />
            
            <View style={styles.secondaryActions}>
              <Button
                title={isFavorite(beachId) ? 'Remover' : 'Favoritar'}
                variant="outline"
                onPress={handleToggleFavorite}
                style={{ flex: 1 }}
              />
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
                <View style={styles.feature}>
                  <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Salva-vidas</Text>
                </View>
              )}
              {beach.has_parking && (
                <View style={styles.feature}>
                  <Ionicons name="car" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Estacionamento</Text>
                </View>
              )}
              {beach.has_bathroom && (
                <View style={styles.feature}>
                  <Ionicons name="fitness" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Banheiros</Text>
                </View>
              )}
              {beach.has_kiosk && (
                <View style={styles.feature}>
                  <Ionicons name="storefront" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Quiosques</Text>
                </View>
              )}
              {beach.accessible && (
                <View style={styles.feature}>
                  <Ionicons name="accessibility" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Acessível</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Crowd Level - mostra sempre, mas deixa claro que é estimativa */}
          {crowdData && crowdData.confidence_score > 0 && (
            <Card style={styles.section}>
              <View style={styles.crowdHeader}>
                <Text style={styles.sectionTitle}>Estimativa de Lotação</Text>
                <View style={styles.estimativeBadge}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.estimativeText}>Estimativa</Text>
                </View>
              </View>
              <View style={styles.crowdContainer}>
                <CrowdBadge 
                  level={crowdData.crowd_level} 
                  size="large" 
                  showLabel={true}
                />
                <View style={styles.crowdDetails}>
                  {crowdData.data_sources[0] === 'checkins' && (
                    <Text style={styles.crowdDetailText}>
                      📍 Baseado em visitantes recentes
                    </Text>
                  )}
                  {crowdData.data_sources[0] === 'traffic' && (
                    <Text style={styles.crowdDetailText}>
                      🚗 Baseado em fluxo de trânsito
                    </Text>
                  )}
                  {crowdData.data_sources[0] === 'estimated' && (
                    <Text style={styles.crowdDetailText}>
                      📊 Baseado em padrões de horário
                    </Text>
                  )}
                  <Text style={styles.crowdDetailText}>
                    Atualizado {getTimeAgo(crowdData.last_updated || crowdData.calculated_at)}
                  </Text>
                  <Text style={styles.crowdDisclaimerText}>
                    Esta é uma estimativa. A lotação real pode variar.
                  </Text>
                </View>
              </View>
            </Card>
          )}

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
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    width: '45%',
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
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
  icpScore: {
    fontSize: 64,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  icpDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
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
    gap: 4,
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
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
});
