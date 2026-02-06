import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface FavoritesContextData {
  favorites: string[];
  loading: boolean;
  isFavorite: (beachId: string) => boolean;
  addFavorite: (beachId: string) => Promise<void>;
  removeFavorite: (beachId: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextData>({} as FavoritesContextData);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStoredFavorites();
  }, []);

  async function loadStoredFavorites() {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async function loadFavorites() {
    setLoading(true);
    try {
      const response = await api.getFavorites();
      const beachIds = response.map((fav: any) => fav.beach_id);
      setFavorites(beachIds);
      await AsyncStorage.setItem('favorites', JSON.stringify(beachIds));
    } catch (error: any) {
      console.error('Error loading favorites from API:', error);
      // Se falhar, mantém os favoritos do cache local
      try {
        const cached = await AsyncStorage.getItem('favorites');
        if (cached) {
          setFavorites(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.error('Error loading favorites from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }

  function isFavorite(beachId: string): boolean {
    return favorites.includes(beachId);
  }

  async function addFavorite(beachId: string) {
    try {
      await api.addFavorite(beachId);
      const updated = [...favorites, beachId];
      setFavorites(updated);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async function removeFavorite(beachId: string) {
    try {
      await api.removeFavorite(beachId);
      const updated = favorites.filter((id) => id !== beachId);
      setFavorites(updated);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        addFavorite,
        removeFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
