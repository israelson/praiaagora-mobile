import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import api from '../../services/api';
import { theme } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedNavigationApp, clearNavigationPreference } from '../../utils/navigation';

// ─── helpers ──────────────────────────────────────────────────────────────────
function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function memberSince(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `Membro desde ${d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
}

interface MenuRowProps {
  icon: any;
  label: string;
  sub?: string;
  iconBg?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

function MenuRow({ icon, label, sub, iconBg, right, onPress, danger }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !right}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg ?? '#E8F5F5' }]}>
        <Ionicons name={icon} size={20} color={danger ? '#E53935' : (iconBg ? '#fff' : theme.colors.primary)} />
      </View>
      <View style={styles.menuLabel}>
        <Text style={[styles.menuLabelText, danger && { color: '#E53935' }]}>{label}</Text>
        {sub ? <Text style={styles.menuLabelSub}>{sub}</Text> : null}
      </View>
      {right !== undefined ? (
        right
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textLight} />
      ) : null}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─── main component ───────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { enabled: notificationsEnabled, dailyReminderEnabled, toggleNotifications, toggleDailyReminder } = useNotifications();
  const { favorites, loadFavorites } = useFavorites();
  const [stats, setStats] = useState<any>(null);
  const [savedNavApp, setSavedNavApp] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Recarrega avatar ao focar (volta do EditProfile)
  useEffect(() => {
    const load = async () => {
      try {
        const uri = await AsyncStorage.getItem('user_avatar');
        setAvatarUri(uri);
      } catch { /* ignore */ }
    };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  useEffect(() => {
    loadStats();
    loadFavorites().catch(() => {});
    getSavedNavigationApp().then(setSavedNavApp);
  }, []);

  useEffect(() => {
    if (stats) setStats((s: any) => ({ ...s, total_favorites: favorites.length }));
  }, [favorites]);

  // Local check-ins merge
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cks = keys.filter((k) => k.startsWith('last_checkin:'));
        const values = await AsyncStorage.multiGet(cks);
        const parsed = values
          .map(([, v]) => { try { return JSON.parse(v || '{}'); } catch { return {}; } })
          .filter((p) => p?.date);
        const count = parsed.length;
        setStats((prev: any) => {
          const base = prev || { total_checkins: 0, total_favorites: 0, unique_beaches: 0 };
          return {
            ...base,
            total_checkins: Math.max(base.total_checkins || 0, count),
            unique_beaches: Math.max(base.unique_beaches || 0, count),
          };
        });
      } catch { /* ignore */ }
    };
    loadLocal();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) { setStats({ total_checkins: 0, total_favorites: 0, unique_beaches: 0 }); return; }
      const response = await api.getUserStats();
      setStats(response);
    } catch {
      setStats({ total_checkins: 0, total_favorites: 0, unique_beaches: 0 });
    }
  };

  const handleNavPreference = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'App de Navegação',
        'No Android o sistema gerencia o app padrão.\n\nAo tocar em "Como Chegar" o Android exibe todos os apps instalados. Escolha "Sempre" para definir o padrão.\n\nPara redefinir: Configurações → Apps → [nome do app] → Abrir por padrão → Limpar padrões.',
        [{ text: 'Entendi' }],
      );
      return;
    }
    Alert.alert(
      'App de Navegação',
      `App salvo: ${savedNavApp ?? 'nenhum'}\n\nDeseja redefinir para perguntar novamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Redefinir',
          style: 'destructive',
          onPress: async () => {
            await clearNavigationPreference();
            setSavedNavApp(null);
          },
        },
      ],
    );
  };

  const handleLogout = () =>
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => { try { await signOut(); } catch { /* ignore */ } },
      },
    ]);

  const navSub = Platform.OS === 'android'
    ? 'Gerenciado pelo sistema'
    : savedNavApp ? `Padrão: ${savedNavApp}` : 'Pergunta a cada vez';

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#9ECFDF', '#1BADB0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          {/* Avatar: local > remote > iniciais */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            {(avatarUri || user?.avatar_url) ? (
              <Image source={{ uri: avatarUri || user?.avatar_url! }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials(user?.full_name)}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.headerName}>
            {user?.full_name ?? 'Usuário'}
          </Text>

          {/* Badges: verificado + provider */}
          <View style={styles.headerBadges}>
            {user?.is_verified && (
              <View style={styles.badgeVerified}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.badgeText}>Verificado</Text>
              </View>
            )}
            {user?.provider && user.provider !== 'email' && (
              <View style={styles.badgeProvider}>
                <Ionicons name="logo-google" size={12} color="#fff" />
                <Text style={styles.badgeText}>{user.provider}</Text>
              </View>
            )}
          </View>

          <Text style={styles.headerEmail}>{user?.email}</Text>

          {user?.city ? (
            <View style={styles.headerCity}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.headerCityText}>{user.city}</Text>
            </View>
          ) : null}

          {memberSince((user as any)?.created_at) ? (
            <Text style={styles.headerSince}>{memberSince((user as any)?.created_at)}</Text>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      {/* ── STATS ── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats?.total_checkins ?? '—'}</Text>
          <Text style={styles.statLbl}>Check-ins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats?.unique_beaches ?? '—'}</Text>
          <Text style={styles.statLbl}>Praias visitadas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats?.total_favorites ?? favorites.length}</Text>
          <Text style={styles.statLbl}>Favoritas</Text>
        </View>
      </View>

      {/* ── AÇÕES RÁPIDAS ── */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Favorites')}>
          <View style={[styles.quickIcon, { backgroundColor: '#FFF0F0' }]}>
            <Ionicons name="heart" size={22} color="#E53935" />
          </View>
          <Text style={styles.quickLabel}>Favoritas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('CheckIn')}>
          <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#43A047" />
          </View>
          <Text style={styles.quickLabel}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Map')}>
          <View style={[styles.quickIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="map" size={22} color="#1E88E5" />
          </View>
          <Text style={styles.quickLabel}>Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('EditProfile')}>
          <View style={[styles.quickIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="person" size={22} color="#8E24AA" />
          </View>
          <Text style={styles.quickLabel}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* ── ATIVIDADE ── */}
      {stats && (stats.first_checkin_date || stats.last_checkin_date || stats.favorite_beach_name || user?.last_login_at) && (
        <View style={styles.section}>
          <SectionHeader title="Atividade" />
          <View style={styles.card}>
            {user?.last_login_at && (
              <>
                <MenuRow
                  icon="time-outline"
                  label="Último acesso"
                  sub={new Date(user.last_login_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  iconBg="#7E57C2"
                />
                {(stats.first_checkin_date || stats.last_checkin_date || stats.favorite_beach_name) && <View style={styles.cardDivider} />}
              </>
            )}
            {stats.first_checkin_date && (
              <>
                <MenuRow
                  icon="calendar-outline"
                  label="Primeiro check-in"
                  sub={new Date(stats.first_checkin_date).toLocaleDateString('pt-BR', { dateStyle: 'long' } as any)}
                  iconBg="#26A69A"
                />
                {(stats.last_checkin_date || stats.favorite_beach_name) && <View style={styles.cardDivider} />}
              </>
            )}
            {stats.last_checkin_date && (
              <>
                <MenuRow
                  icon="footsteps-outline"
                  label="Último check-in"
                  sub={new Date(stats.last_checkin_date).toLocaleDateString('pt-BR', { dateStyle: 'long' } as any)}
                  iconBg="#42A5F5"
                />
                {stats.favorite_beach_name && <View style={styles.cardDivider} />}
              </>
            )}
            {stats.favorite_beach_name && (
              <MenuRow
                icon="heart-outline"
                label="Praia favorita"
                sub={stats.favorite_beach_name}
                iconBg="#EF5350"
              />
            )}
          </View>
        </View>
      )}

      {/* ── CONTA ── */}
      <View style={styles.section}>
        <SectionHeader title="Conta" />
        <View style={styles.card}>
          <MenuRow
            icon="person-outline"
            label="Editar Perfil"
            sub="Nome, cidade e foto"
            iconBg="#1BADB0"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <View style={styles.cardDivider} />
          <MenuRow
            icon="shield-outline"
            label="Privacidade"
            sub="Dados e permissões"
            iconBg="#5C6BC0"
            onPress={() => navigation.navigate('Privacy')}
          />
        </View>
      </View>

      {/* ── PREFERÊNCIAS ── */}
      <View style={styles.section}>
        <SectionHeader title="Preferências" />
        <View style={styles.card}>
          <MenuRow
            icon="notifications-outline"
            label="Notificações Push"
            sub={notificationsEnabled ? 'Ativas' : 'Inativas'}
            iconBg={notificationsEnabled ? '#FB8C00' : '#9E9E9E'}
            right={
              <Switch
                value={!!notificationsEnabled}
                onValueChange={toggleNotifications}
                thumbColor={notificationsEnabled ? theme.colors.primary : undefined}
                trackColor={{ true: `${theme.colors.primary}66`, false: undefined }}
              />
            }
          />
          {notificationsEnabled && (
            <>
              <View style={styles.cardDivider} />
              <MenuRow
                icon="alarm-outline"
                label="Lembrete Diário"
                sub="Às 08:00 — resumo das praias"
                iconBg="#F4511E"
                right={
                  <Switch
                    value={!!dailyReminderEnabled}
                    onValueChange={toggleDailyReminder}
                    thumbColor={dailyReminderEnabled ? theme.colors.primary : undefined}
                    trackColor={{ true: `${theme.colors.primary}66`, false: undefined }}
                  />
                }
              />
            </>
          )}
          <View style={styles.cardDivider} />
          <MenuRow
            icon="navigate-outline"
            label="App de Navegação"
            sub={navSub}
            iconBg="#00ACC1"
            onPress={handleNavPreference}
          />
        </View>
      </View>

      {/* ── SUPORTE ── */}
      <View style={styles.section}>
        <SectionHeader title="Suporte" />
        <View style={styles.card}>
          <MenuRow
            icon="help-circle-outline"
            label="Ajuda"
            sub="Central de ajuda e FAQ"
            iconBg="#43A047"
            onPress={() =>
              Alert.alert(
                'Ajuda',
                'Envie um e-mail para suporte@beachly.app ou acesse beachly.app/ajuda.',
                [{ text: 'OK' }],
              )
            }
          />
          <View style={styles.cardDivider} />
          <MenuRow
            icon="star-outline"
            label="Avalie o Beachly"
            sub="Sua opinião nos ajuda muito"
            iconBg="#FFB300"
            onPress={() =>
              Alert.alert('Obrigado!', 'Em breve você poderá nos avaliar na loja de apps.')
            }
          />
          <View style={styles.cardDivider} />
          <MenuRow
            icon="information-circle-outline"
            label="Sobre o Beachly"
            sub="Versão 1.0.0"
            iconBg="#546E7A"
            onPress={() =>
              Alert.alert(
                'Beachly v1.0.0',
                'O app que conecta você às melhores praias do Brasil com informações de qualidade da água, condições climáticas e lotação em tempo real.\n\n© 2026 Beachly. Todos os direitos reservados.',
                [{ text: 'OK' }],
              )
            }
          />
        </View>
      </View>

      {/* ── SAIR ── */}
      <View style={styles.section}>
        <View style={styles.card}>
          <MenuRow
            icon="log-out-outline"
            label="Sair da conta"
            iconBg="#E53935"
            danger
            onPress={handleLogout}
          />
        </View>
      </View>

      <Text style={styles.version}>Beachly v1.0.0 • Feito com ♥ para o litoral</Text>
    </ScrollView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F6F8',
  },

  // Header
  headerGradient: {},
  headerInner: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  headerCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  headerCityText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  headerSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Stats bar
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 0,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
    lineHeight: 26,
  },
  statLbl: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight ?? '#F0F0F0',
    marginLeft: 56,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  menuLabelText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  menuLabelSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.textLight,
    paddingVertical: 24,
  },
});
