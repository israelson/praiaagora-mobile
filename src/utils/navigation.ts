import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = '@beachly:nav_app_preference';

/** Monta as URLs de navegação para um par de coordenadas. */
function buildUrls(latitude: number, longitude: number) {
  return {
    waze: `waze://?ll=${latitude},${longitude}&navigate=yes`,
    googleMaps: Platform.select({
      ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
      android: `google.navigation:q=${latitude},${longitude}`,
    }) as string,
    appleMaps: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
    browser: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  };
}

/** Abre o app preferido salvo, atualizando a URL com as novas coordenadas. */
async function openPreferred(appId: string, latitude: number, longitude: number): Promise<boolean> {
  const urls = buildUrls(latitude, longitude);
  const map: Record<string, string> = {
    waze: urls.waze,
    googleMaps: urls.googleMaps,
    appleMaps: urls.appleMaps,
    browser: urls.browser,
  };

  const url = map[appId];
  if (!url) return false;

  try {
    // browser sempre pode abrir
    if (appId === 'browser') {
      await Linking.openURL(url);
      return true;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    // App preferido foi desinstalado — limpa preferência
    await AsyncStorage.removeItem(PREF_KEY);
    return false;
  } catch {
    return false;
  }
}

/**
 * Abre a navegação para a praia.
 * - Se o usuário já escolheu um app padrão, abre direto.
 * - Se não, exibe o menu, salva a preferência e abre.
 */
export async function openNavigationWithChoice(
  latitude: number,
  longitude: number,
  beachName?: string,
) {
  const urls = buildUrls(latitude, longitude);

  // ── Verificar preferência salva ──────────────────────────────────
  try {
    const saved = await AsyncStorage.getItem(PREF_KEY);
    if (saved) {
      const opened = await openPreferred(saved, latitude, longitude);
      if (opened) return;
      // Preferência inválida/app desinstalado → cai no menu abaixo
    }
  } catch {
    // Ignora erro de leitura e cai no menu
  }

  // ── Construir lista de apps disponíveis ──────────────────────────
  const candidates: { id: string; label: string; url: string }[] = [];

  try {
    if (await Linking.canOpenURL(urls.waze)) {
      candidates.push({ id: 'waze', label: 'Waze', url: urls.waze });
    }
  } catch { /* ignore */ }

  try {
    if (urls.googleMaps && await Linking.canOpenURL(urls.googleMaps)) {
      candidates.push({ id: 'googleMaps', label: 'Google Maps', url: urls.googleMaps });
    }
  } catch { /* ignore */ }

  if (Platform.OS === 'ios') {
    try {
      if (await Linking.canOpenURL(urls.appleMaps)) {
        candidates.push({ id: 'appleMaps', label: 'Apple Maps', url: urls.appleMaps });
      }
    } catch { /* ignore */ }
  }

  // Fallback navegador sempre disponível
  candidates.push({ id: 'browser', label: 'Google Maps (Navegador)', url: urls.browser });

  // Se apenas o fallback existir, abre direto sem menu
  if (candidates.length === 1) {
    await Linking.openURL(candidates[0].url);
    return;
  }

  // ── Exibir menu de escolha ────────────────────────────────────────
  Alert.alert(
    'Como Chegar',
    `Para onde ir com ${beachName ?? 'a praia'}?\nEscolha seu app de navegação:`,
    [
      ...candidates.map(app => ({
        text: app.label,
        onPress: async () => {
          // Salva preferência e abre
          try {
            await AsyncStorage.setItem(PREF_KEY, app.id);
          } catch { /* ignore */ }
          await Linking.openURL(app.url);
        },
      })),
      { text: 'Cancelar', style: 'cancel' },
    ],
  );
}

/**
 * Limpa o app de navegação padrão salvo.
 * Útil para expor nas configurações do perfil.
 */
export async function clearNavigationPreference(): Promise<void> {
  await AsyncStorage.removeItem(PREF_KEY);
}

/**
 * Retorna o nome amigável do app salvo (ou null se não houver).
 */
export async function getSavedNavigationApp(): Promise<string | null> {
  const labels: Record<string, string> = {
    waze: 'Waze',
    googleMaps: 'Google Maps',
    appleMaps: 'Apple Maps',
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
export async function openNavigation(latitude: number, longitude: number, beachName?: string) {
  return openNavigationWithChoice(latitude, longitude, beachName);
}
