import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const hasToken = async () => {
  const t = await AsyncStorage.getItem('access_token');
  return !!t;
};

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
    // Sem token não faz sentido chamar a API - usa cache local
    if (!(await hasToken())) {
      try {
        const cached = await AsyncStorage.getItem('favorites');
        if (cached) setFavorites(JSON.parse(cached));
      } catch {}
      return;
    }
    setLoading(true);
    try {
      const response = await api.getFavorites();
      const beachIds = response.map((fav: any) => fav.beach_id);
      setFavorites(beachIds);
      await AsyncStorage.setItem('favorites', JSON.stringify(beachIds));
    } catch (error: any) {
      // Silently fall back to local cache to avoid console noise on unauthenticated loads
      try {
        const cached = await AsyncStorage.getItem('favorites');
        if (cached) setFavorites(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  }

  function isFavorite(beachId: string): boolean {
    return favorites.includes(beachId);
  }

  async function addFavorite(beachId: string) {
    if (!(await hasToken())) {
      throw new Error('Faça login para adicionar favoritos');
    }
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
    if (!(await hasToken())) {
      throw new Error('Faça login para remover favoritos');
    }
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
