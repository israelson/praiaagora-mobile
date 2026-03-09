import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupNotifications,
  requestPermissionsAndGetToken,
  registerTokenWithBackend,
  cancelAllNotifications,
  scheduleDailyReminder,
  cancelDailyReminder,
  getStoredToken,
} from '../services/notifications';

interface NotificationsContextData {
  /** Whether the user has enabled push notifications */
  enabled: boolean;
  /** Expo push token (null when not available) */
  pushToken: string | null;
  /** Daily reminder active */
  dailyReminderEnabled: boolean;
  /** Toggle notifications on/off (requests permission on first enable) */
  toggleNotifications: (value: boolean) => Promise<void>;
  /** Toggle the daily 08:00 reminder */
  toggleDailyReminder: (value: boolean) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextData>(
  {} as NotificationsContextData
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);

  // Listeners refs (to unsubscribe on unmount)
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Restore preferences
      const storedEnabled = await AsyncStorage.getItem('notifications_enabled');
      const isEnabled = storedEnabled === 'true';
      setEnabled(isEnabled);

      const storedDailyReminder = await AsyncStorage.getItem('daily_reminder_enabled');
      setDailyReminderEnabled(storedDailyReminder === 'true');

      // Restore push token
      const token = await getStoredToken();
      if (token) setPushToken(token);

      // If enabled, ensure token is fresh
      if (isEnabled) {
        const freshToken = await setupNotifications();
        if (freshToken) setPushToken(freshToken);
      }

      // Listen for notifications received in foreground
      receivedListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('[Notifications] Received:', notification.request.content.title);
        }
      );

      // Listen for notification tap (response)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as any;
          console.log('[Notifications] Tapped:', data);
          // Deep-link navigation handled in App.tsx via navigationRef
        }
      );
    })();

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── Toggle push notifications ──────────────────────────────────────────────
  const toggleNotifications = async (value: boolean) => {
    setEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');

    if (value) {
      const token = await requestPermissionsAndGetToken();
      if (token) {
        setPushToken(token);
        await registerTokenWithBackend(token);
      }
      // token null = Expo Go ou permissão negada
      // Se foi permissão negada, getPermissionsAsync já logou aviso.
      // Mantemos o toggle ligado para notificações locais funcionarem.
    } else {
      // Disable: cancel all scheduled local notifications
      await cancelAllNotifications();
      setDailyReminderEnabled(false);
      await AsyncStorage.setItem('daily_reminder_enabled', 'false');
    }
  };

  // ── Toggle daily reminder ──────────────────────────────────────────────────
  const toggleDailyReminder = async (value: boolean) => {
    setDailyReminderEnabled(value);
    await AsyncStorage.setItem('daily_reminder_enabled', value ? 'true' : 'false');

    if (value) {
      await scheduleDailyReminder(8, 0);
    } else {
      await cancelDailyReminder();
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        enabled,
        pushToken,
        dailyReminderEnabled,
        toggleNotifications,
        toggleDailyReminder,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
