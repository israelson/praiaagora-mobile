import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../../contexts/FavoritesContext';
import api from '../../services/api';
import BeachCard from '../../components/beach/BeachCard';
import { theme } from '../../theme';

export default function FavoritesScreen({ navigation }: any) {
  const { favorites, isFavorite, removeFavorite, loadFavorites } = useFavorites();
  const [favoriteBeaches, setFavoriteBeaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavoriteBeaches();
  }, [favorites]);

  const loadFavoriteBeaches = async () => {
    if (favorites.length === 0) {
      setFavoriteBeaches([]);
      return;
    }

    setLoading(true);
    try {
      const beachPromises = favorites.map((beachId) => api.getBeachById(beachId));
      const beaches = await Promise.all(beachPromises);
      setFavoriteBeaches(beaches);
    } catch (error) {
      console.error('Error loading favorite beaches:', error);
      Alert.alert('Erro', 'Não foi possível carregar as praias favoritas');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (beachId: string) => {
    Alert.alert(
      'Remover Favorito',
      'Deseja remover esta praia dos favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite(beachId);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover dos favoritos');
            }
          },
        },
      ]
    );
  };

  const renderBeach = ({ item }: any) => (
    <BeachCard
      beach={item}
      onPress={() => navigation.navigate('BeachDetail', { beachId: item.id })}
      isFavorite={true}
      onToggleFavorite={() => handleRemoveFavorite(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={theme.colors.textLight} />
      <Text style={styles.emptyText}>Nenhuma praia favorita</Text>
      <Text style={styles.emptySubtext}>
        Adicione praias aos favoritos para acessá-las rapidamente aqui
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteBeaches}
        renderItem={renderBeach}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          favoriteBeaches.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              loadFavorites();
              loadFavoriteBeaches();
            }}
          />
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
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});
