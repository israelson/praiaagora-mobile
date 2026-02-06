import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import BeachCard from '../../components/beach/BeachCard';
import Input from '../../components/ui/Input';
import ActivityFilter from '../../components/ActivityFilter';
import { theme } from '../../theme';

const CITIES = [
  'Todas',
  'Florianópolis',
  'Balneário Camboriú',
  'Itajaí',
  'Bombinhas',
  'Porto Belo',
  'Penha',
  'Navegantes',
];

const WATER_QUALITY_FILTERS = [
  { label: 'Todas', value: 'ALL' },
  { label: '✅ Próprias', value: 'PROPER' },
  { label: '❌ Impróprias', value: 'IMPROPER' },
  { label: 'Com dados', value: 'WITH_DATA' },
];

export default function ExploreScreen({ navigation }: any) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [beaches, setBeaches] = useState([]);
  const [filteredBeaches, setFilteredBeaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [waterQualityFilter, setWaterQualityFilter] = useState('ALL');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  useEffect(() => {
    loadBeaches();
  }, []);

  useEffect(() => {
    filterBeaches();
  }, [searchQuery, selectedCity, waterQualityFilter, selectedActivities, beaches]);

  const loadBeaches = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (selectedActivities.length > 0) {
        params.activities = selectedActivities.join(',');
      }
      const response = await api.getBeaches(params);
      // A API retorna diretamente um array, não um objeto com 'beaches'
      const beachesArray = Array.isArray(response) ? response : response.beaches || [];
      console.log(`Loaded ${beachesArray.length} beaches from API`);
      setBeaches(beachesArray);
    } catch (error) {
      console.error('Error loading beaches:', error);
      Alert.alert('Erro', 'Não foi possível carregar as praias');
    } finally {
      setLoading(false);
    }
  };

  const filterBeaches = () => {
    let filtered = [...beaches];

    // Filter by city
    if (selectedCity !== 'Todas') {
      filtered = filtered.filter(
        (beach: any) => beach.city === selectedCity
      );
    }

    // Filter by water quality
    if (waterQualityFilter !== 'ALL') {
      if (waterQualityFilter === 'PROPER') {
        filtered = filtered.filter(
          (beach: any) => beach.current_condition?.water_quality === 'PROPER' || beach.water_quality === 'PROPER'
        );
      } else if (waterQualityFilter === 'IMPROPER') {
        filtered = filtered.filter(
          (beach: any) => beach.current_condition?.water_quality === 'IMPROPER' || beach.water_quality === 'IMPROPER'
        );
      } else if (waterQualityFilter === 'WITH_DATA') {
        filtered = filtered.filter(
          (beach: any) => (beach.current_condition?.water_quality || beach.water_quality) !== null
        );
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((beach: any) =>
        beach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beach.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBeaches(filtered);
  };

  const handleToggleActivity = (activity: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activity)) {
        return prev.filter(a => a !== activity);
      } else {
        return [...prev, activity];
      }
    });
  };

  // Reload beaches when activities change
  useEffect(() => {
    loadBeaches();
  }, [selectedActivities]);

  const handleToggleFavorite = useCallback(async (beachId: string) => {
    try {
      if (isFavorite(beachId)) {
        await removeFavorite(beachId);
      } else {
        await addFavorite(beachId);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const renderBeach = useCallback(({ item }: any) => (
    <BeachCard
      beach={item}
      onPress={() => navigation.navigate('BeachDetail', { beachId: item.id })}
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
    />
  ), [navigation, isFavorite, handleToggleFavorite]);

  const renderHeader = useMemo(() => (
    <View>
      <Input
        placeholder="Buscar praias..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        icon="search"
        containerStyle={styles.searchInput}
      />

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Cidade:</Text>
        <FlatList
          horizontal
          data={CITIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCity === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCity(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCity === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Qualidade da Água:</Text>
        <FlatList
          horizontal
          data={WATER_QUALITY_FILTERS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                waterQualityFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setWaterQualityFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  waterQualityFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <ActivityFilter 
        selectedActivities={selectedActivities}
        onToggleActivity={handleToggleActivity}
      />

      <Text style={styles.resultsCount}>
        {filteredBeaches.length} praias encontradas
      </Text>
    </View>
  ), [searchQuery, selectedCity, waterQualityFilter, filteredBeaches]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={theme.colors.textLight} />
      <Text style={styles.emptyText}>Nenhuma praia encontrada</Text>
      <Text style={styles.emptySubtext}>
        Tente ajustar os filtros ou buscar por outro termo
      </Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBeaches}
        renderItem={renderBeach}
        keyExtractor={(item: any) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBeaches} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  filterList: {
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: theme.colors.textInverse,
  },
  resultsCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
