import 'react-native-gesture-handler';
import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import { ThemeProvider, useTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';

// Suprimir aviso do expo-notifications no Expo Go (SDK 53+)
// Push remoto não funciona no Expo Go; notificações locais continuam OK.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

function AppContent() {
  const { isDark } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Handle notification taps → deep-link navigation
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;

      if (!navigationRef.current?.isReady()) return;

      if (data?.type === 'water_quality' && data?.beachId) {
        navigationRef.current?.navigate('BeachDetail', { beachId: data.beachId });
      } else if (data?.type === 'daily_reminder') {
        navigationRef.current?.navigate('Explore');
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <NotificationsProvider>
              <AppContent />
            </NotificationsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
