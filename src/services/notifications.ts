import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// ── Storage keys ────────────────────────────────────────────────────────────
const PUSH_TOKEN_KEY = 'expo_push_token';
const NOTIF_ENABLED_KEY = 'notifications_enabled';

// ── Expo Go detection ────────────────────────────────────────────────────────
// Remote push notifications (getExpoPushTokenAsync) foram removidas do
// Expo Go no SDK 53. Notificações locais (scheduleNotificationAsync) ainda
// funcionam normalmente.
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

// ── Default notification handler ────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Android channel setup ────────────────────────────────────────────────────
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('balneability', {
      name: 'Qualidade da Água',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1BADB0',
      description: 'Alertas sobre a qualidade da água das praias favoritas',
    });

    await Notifications.setNotificationChannelAsync('checkin', {
      name: 'Check-ins',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Lembretes e confirmações de check-in',
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Notificações gerais do Beachly',
    });
  } catch (error) {
    console.warn('[Notifications] setupAndroidChannel error (ignorado):', error);
  }
}

// ── Request permission + get Expo push token ─────────────────────────────────
export async function requestPermissionsAndGetToken(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return null;
    }

    await setupAndroidChannel();

    // Push remotos NÃO funcionam no Expo Go (SDK 53+)
    // Retorna null mas não bloqueia notificações locais
    if (isExpoGo) {
      console.info('[Notifications] Expo Go detectado — push remoto desabilitado. Notificações locais funcionam normalmente.');
      return null;
    }

    // Expo push token requires projectId
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Notifications] No projectId found — cannot get push token');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.warn('[Notifications] Error getting push token (ignorado):', error);
    return null;
  }
}

// ── Register token with backend ──────────────────────────────────────────────
export async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    // Backend endpoint expects fcm_token; Expo push tokens also work
    // if the backend uses expo-server-sdk for delivery
    await api.registerFCMToken(token);
    console.log('[Notifications] Token registered with backend');
  } catch (error) {
    console.warn('[Notifications] Failed to register token with backend:', error);
    // Non-fatal: local notifications still work
  }
}

// ── Full setup (permission → token → backend) ────────────────────────────────
export async function setupNotifications(): Promise<string | null> {
  const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  // Only attempt full setup if user has enabled notifications
  if (enabled !== 'true') return null;

  const token = await requestPermissionsAndGetToken();
  if (token) {
    await registerTokenWithBackend(token);
  }
  return token;
}

// ── Stored token helpers ─────────────────────────────────────────────────────
export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// ── Local notification schedulers ────────────────────────────────────────────

/**
 * Sends an immediate local notification about water quality.
 *
 * @param beachName  Beach display name
 * @param quality    'PROPER' | 'IMPROPER' | string
 * @param beachId    Used in notification data for deep-link navigation
 */
export async function notifyWaterQuality(
  beachName: string,
  quality: string,
  beachId: string | number
): Promise<void> {
  try {
    const isProper = quality === 'PROPER';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isProper
          ? `✅ ${beachName} — Água Própria`
          : `⚠️ ${beachName} — Água Imprópria`,
        body: isProper
          ? 'A qualidade da água está boa. Bom banho! 🌊'
          : 'A praia está com água imprópria para banho. Evite o mergulho.',
        data: { type: 'water_quality', beachId: String(beachId) },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'balneability' }),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notifications] notifyWaterQuality error (ignorado):', error);
  }
}

/**
 * Schedule a daily reminder to check beach conditions,
 * e.g. every day at 08:00.
 */
export async function scheduleDailyReminder(hour = 8, minute = 0): Promise<string> {
  try {
    await cancelDailyReminder();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌊 Bom dia! Como estão as praias?',
        body: 'Confira a qualidade da água e condições das suas praias favoritas.',
        data: { type: 'daily_reminder' },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'general' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    await AsyncStorage.setItem('daily_reminder_id', id);
    return id;
  } catch (error) {
    console.warn('[Notifications] scheduleDailyReminder error (ignorado):', error);
    return '';
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem('daily_reminder_id');
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem('daily_reminder_id');
    }
  } catch {
    // ignore
  }
}

/**
 * Fire a local "check-in" confirmation notification.
 */
export async function notifyCheckinSuccess(beachName: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📍 Check-in realizado!`,
        body: `Você está em ${beachName}. Obrigado por contribuir com os dados! 🤙`,
        data: { type: 'checkin' },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'checkin' }),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notifications] notifyCheckinSuccess error (ignorado):', error);
  }
}

// ── Cancel all ───────────────────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
