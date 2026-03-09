import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = '@beachly:nav_app_preference';

// ─────────────────────────────────────────────────────────────────────────────
// URLs por app (iOS usa schemes, Android usa intents nativos)
// ─────────────────────────────────────────────────────────────────────────────
interface NavApp {
  id: string;
  label: string;
  urlAndroid: string;
  urlIOS: string;
}

function getApps(lat: number, lon: number, name: string): NavApp[] {
  const encoded = encodeURIComponent(name);
  return [
    {
      id: 'waze',
      label: 'Waze',
      urlAndroid: `waze://?ll=${lat},${lon}&navigate=yes`,
      urlIOS:     `waze://?ll=${lat},${lon}&navigate=yes`,
    },
    {
      id: 'googleMaps',
      label: 'Google Maps',
      urlAndroid: `google.navigation:q=${lat},${lon}&mode=d`,
      urlIOS:     `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`,
    },
    {
      id: 'moovit',
      label: 'Moovit',
      urlAndroid: `moovit://directions?dest_lat=${lat}&dest_lon=${lon}&dest_name=${encoded}`,
      urlIOS:     `moovit://directions?dest_lat=${lat}&dest_lon=${lon}&dest_name=${encoded}`,
    },
    {
      id: 'osmand',
      label: 'OsmAnd',
      urlAndroid: `osmand.navigation:q=${lat},${lon}`,
      urlIOS:     `osmand-maps://navigate?lat=${lat}&lon=${lon}&z=15`,
    },
    {
      id: 'here',
      label: 'HERE Maps',
      urlAndroid: `here-route://mylocation/${lat},${lon}/${encoded}`,
      urlIOS:     `here-route://mylocation/${lat},${lon}/${encoded}`,
    },
    {
      id: 'browser',
      label: 'Google Maps (Navegador)',
      urlAndroid: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
      urlIOS:     `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// ANDROID: usa intent geo: — o sistema mostra TODOS os apps de navegação
// instalados com o diálogo nativo "Abrir com... / Sempre / Uma vez"
// ─────────────────────────────────────────────────────────────────────────────
async function openAndroid(lat: number, lon: number, name: string) {
  const encoded = encodeURIComponent(name);
  // geo: intent dispara o seletor nativo do Android com todos os apps instalados
  const geoUrl = `geo:${lat},${lon}?q=${lat},${lon}(${encoded})`;
  try {
    await Linking.openURL(geoUrl);
  } catch {
    // Fallback: Google Maps no navegador
    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS: testa cada scheme e exibe menu customizado; salva preferência
// ─────────────────────────────────────────────────────────────────────────────
async function openIOS(lat: number, lon: number, name: string) {
  const apps = getApps(lat, lon, name);

  // Verificar preferência salva
  try {
    const saved = await AsyncStorage.getItem(PREF_KEY);
    if (saved) {
      const app = apps.find(a => a.id === saved);
      if (app) {
        const canOpen = app.id === 'browser'
          ? true
          : await Linking.canOpenURL(app.urlIOS);
        if (canOpen) {
          await Linking.openURL(app.urlIOS);
          return;
        }
        // App desinstalado → limpa prefência
        await AsyncStorage.removeItem(PREF_KEY);
      }
    }
  } catch { /* ignora */ }

  // Detectar apps disponíveis
  const available: NavApp[] = [];
  for (const app of apps) {
    if (app.id === 'browser') {
      available.push(app);
      continue;
    }
    try {
      if (await Linking.canOpenURL(app.urlIOS)) {
        available.push(app);
      }
    } catch { /* ignore */ }
  }

  if (available.length === 1) {
    await Linking.openURL(available[0].urlIOS);
    return;
  }

  Alert.alert(
    'Como Chegar',
    `Escolha o app de navegação para ${name}:`,
    [
      ...available.map(app => ({
        text: app.label,
        onPress: async () => {
          try { await AsyncStorage.setItem(PREF_KEY, app.id); } catch { /* ignore */ }
          await Linking.openURL(app.urlIOS);
        },
      })),
      { text: 'Cancelar', style: 'cancel' },
    ],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportações públicas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Abre a navegação para a praia.
 * Android → intent geo: (seletor nativo do sistema)
 * iOS     → menu customizado com apps instalados + preferência salva
 */
export async function openNavigationWithChoice(
  latitude: number,
  longitude: number,
  beachName?: string,
) {
  const name = beachName ?? 'Praia';
  if (Platform.OS === 'android') {
    await openAndroid(latitude, longitude, name);
  } else {
    await openIOS(latitude, longitude, name);
  }
}

/**
 * Limpa o app de navegação padrão salvo (iOS).
 * No Android o sistema gerencia o padrão automaticamente.
 */
export async function clearNavigationPreference(): Promise<void> {
  await AsyncStorage.removeItem(PREF_KEY);
}

/**
 * Retorna o nome amigável do app salvo (iOS apenas, ou null).
 */
export async function getSavedNavigationApp(): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;
  const labels: Record<string, string> = {
    waze: 'Waze',
    googleMaps: 'Google Maps',
    moovit: 'Moovit',
    osmand: 'OsmAnd',
    here: 'HERE Maps',
    browser: 'Google Maps (Navegador)',
  };
  try {
    const saved = await AsyncStorage.getItem(PREF_KEY);
    return saved ? (labels[saved] ?? null) : null;
  } catch {
    return null;
  }
}

/** @deprecated Use openNavigationWithChoice */
export async function openNavigation(
  latitude: number,
  longitude: number,
  beachName?: string,
) {
  return openNavigationWithChoice(latitude, longitude, beachName);
}
