import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  city?: string;          // campo local (não retornado pelo backend)
  is_active: boolean;
  is_verified: boolean;
  provider: string;       // 'email' | 'google' | etc.
  avatar_url?: string | null;  // URL remota de avatar (ex: foto do Google)
  role?: string;
  last_login_at?: string | null;
  created_at: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    full_name: string;
    city?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('access_token');

      if (storedUser && storedToken) {
        // Carrega do cache imediatamente para não bloquear o app
        setUser(JSON.parse(storedUser));

        // Em background, atualiza com dados frescos do backend (is_verified, avatar_url, last_login_at, etc.)
        api.getProfile().then(async (freshUser) => {
          const cached = JSON.parse(storedUser);
          // Preserva campos locais (city não vem do backend)
          const updated = { ...cached, ...freshUser, city: freshUser.city ?? cached.city };
          await AsyncStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        }).catch(() => { /* ignora falha de rede — usa cache */ });
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await api.login(email, password);
      const { access_token, refresh_token } = response;

      await AsyncStorage.multiSet([
        ['access_token', access_token],
        ['refresh_token', refresh_token],
      ]);

      // Busca dados do usuário após autenticar
      const userData = await api.getProfile();
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  }

  async function signUp(data: {
    email: string;
    password: string;
    full_name: string;
    city?: string;
  }) {
    try {
      // Registra o usuário
      await api.register(data);
      
      // Faz login automaticamente após o registro
      await signIn(data.email, data.password);
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      await api.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      setUser(null);
    }
  }

  function updateUser(data: Partial<User>) {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
