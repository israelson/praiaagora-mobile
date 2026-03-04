import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { theme } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut, updateUser } = useAuth();
  const { enabled: notificationsEnabled, dailyReminderEnabled, toggleNotifications, toggleDailyReminder } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { favorites, loadFavorites } = useFavorites();

  useEffect(() => {
    loadStats();
    // ensure favorites are loaded from API/cache
    loadFavorites().catch(() => {});
  }, []);

  // Load local check-ins saved in AsyncStorage (keys like last_checkin:{beachId})
  useEffect(() => {
    const loadLocalCheckins = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const checkinKeys = keys.filter((k) => k.startsWith('last_checkin:'));
        if (checkinKeys.length === 0) {
          // ensure stats reflect zero if server returned null
          if (stats) {
            setStats((s: any) => ({ ...s, total_checkins: s.total_checkins || 0, unique_beaches_visited: s.unique_beaches_visited || 0 }));
          }
          return;
        }

        const values = await AsyncStorage.multiGet(checkinKeys);
        const parsed = values.map(([, v]) => {
          try { return JSON.parse(v || '{}'); } catch { return {} }
        }).filter((p) => p && p.date);

        const uniqueBeaches = parsed.length; // one per beach in this storage scheme
        const totalCheckinsLocal = parsed.length;

        // Merge with server stats if present
        setStats((prev: any) => {
          const base = prev || { total_checkins: 0, total_favorites: 0, unique_beaches_visited: 0 };
          return {
            ...base,
            total_checkins: Math.max(base.total_checkins || 0, totalCheckinsLocal),
            unique_beaches_visited: Math.max(base.unique_beaches_visited || 0, uniqueBeaches),
          };
        });
      } catch (e) {
        console.error('Error loading local checkins for stats', e);
      }
    };
    loadLocalCheckins();
  }, []);

  // Keep stats.total_favorites in sync with local favorites cache
  useEffect(() => {
    if (stats) {
      setStats((s: any) => ({ ...s, total_favorites: favorites.length }));
    }
  }, [favorites]);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setStats({ total_checkins: 0, total_favorites: 0, unique_beaches_visited: 0 });
        return;
      }
      const response = await api.getUserStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ total_checkins: 0, total_favorites: 0, unique_beaches_visited: 0 });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={60} color={theme.colors.textInverse} />
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.city && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.city}>{user.city}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} variant="outlined">
              <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
              <Text style={styles.statValue}>{stats.total_checkins || 0}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </Card>

            <Card style={styles.statCard} variant="outlined">
              <Ionicons name="heart" size={32} color={theme.colors.error} />
              <Text style={styles.statValue}>{stats.total_favorites || 0}</Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </Card>

            <Card style={styles.statCard} variant="outlined">
              <Ionicons name="map" size={32} color={theme.colors.secondary} />
              <Text style={styles.statValue}>{stats.unique_beaches_visited || 0}</Text>
              <Text style={styles.statLabel}>Praias Visitadas</Text>
            </Card>
          </View>
        </View>
      )}

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="person-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Editar Perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
            <View>
              <Text style={styles.menuItemText}>Notificações Push</Text>
              <Text style={styles.menuItemSub}>
                {notificationsEnabled ? 'Ativas — toque para desativar' : 'Inativas'}
              </Text>
            </View>
          </View>
          <Switch
            value={!!notificationsEnabled}
            onValueChange={toggleNotifications}
            thumbColor={notificationsEnabled ? theme.colors.primary : undefined}
            trackColor={{ true: `${theme.colors.primary}66`, false: undefined }}
          />
        </View>

        {notificationsEnabled && (
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="alarm-outline" size={24} color={theme.colors.text} />
              <View>
                <Text style={styles.menuItemText}>Lembrete Diário</Text>
                <Text style={styles.menuItemSub}>Às 08:00 — resumo das praias</Text>
              </View>
            </View>
            <Switch
              value={!!dailyReminderEnabled}
              onValueChange={toggleDailyReminder}
              thumbColor={dailyReminderEnabled ? theme.colors.primary : undefined}
              trackColor={{ true: `${theme.colors.primary}66`, false: undefined }}
            />
          </View>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="shield-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Privacidade</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Ajuda',
              'Para suporte, envie um e-mail para suporte@beachly.app ou acesse nossa central de ajuda em beachly.app/ajuda.',
              [{ text: 'OK' }]
            )
          }
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Ajuda</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert(
              'Sobre o Beachly',
              'Beachly v1.0.0\n\nO app que conecta você às melhores praias do Brasil com informações de qualidade da água, condições climáticas e lotação em tempo real.\n\n© 2026 Beachly. Todos os direitos reservados.',
              [{ text: 'OK' }]
            )
          }
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
            <Text style={styles.menuItemText}>Sobre</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <Button
          title="Sair"
          variant="outline"
          onPress={handleLogout}
          fullWidth
        />
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Beachly v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  menuItemSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  version: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  versionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
});
