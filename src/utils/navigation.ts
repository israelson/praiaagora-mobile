import { Linking, Platform, Alert } from 'react-native';

/**
 * Abre o app de navegação com as coordenadas da praia.
 * Tenta abrir Waze primeiro, depois Google Maps, depois Apple Maps (iOS).
 */
export async function openNavigation(latitude: number, longitude: number, beachName?: string) {
  const label = encodeURIComponent(beachName || 'Praia');
  
  // URLs para diferentes apps de navegação
  const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
  const googleMapsUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
  const browserMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  // Tentar abrir apps na ordem de preferência
  try {
    // 1. Tentar Waze (popular no Brasil)
    const canOpenWaze = await Linking.canOpenURL(wazeUrl);
    if (canOpenWaze) {
      await Linking.openURL(wazeUrl);
      return;
    }

    // 2. Tentar Google Maps app
    if (googleMapsUrl) {
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
        return;
      }
    }

    // 3. iOS: Tentar Apple Maps
    if (Platform.OS === 'ios') {
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapsUrl);
        return;
      }
    }

    // 4. Fallback: Abrir Google Maps no navegador
    await Linking.openURL(browserMapsUrl);
  } catch (error) {
    console.error('Error opening navigation:', error);
    Alert.alert(
      'Erro',
      'Não foi possível abrir o app de navegação. Verifique se você tem Google Maps ou Waze instalado.'
    );
  }
}

/**
 * Mostra um menu para o usuário escolher qual app usar.
 */
export async function openNavigationWithChoice(latitude: number, longitude: number, beachName?: string) {
  const label = encodeURIComponent(beachName || 'Praia');
  
  const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
  const googleMapsUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  const browserMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  // Verificar quais apps estão disponíveis
  const availableApps: { name: string; url: string }[] = [];

  try {
    if (await Linking.canOpenURL(wazeUrl)) {
      availableApps.push({ name: 'Waze', url: wazeUrl });
    }
  } catch (e) {
    // Ignore
  }

  try {
    if (googleMapsUrl && await Linking.canOpenURL(googleMapsUrl)) {
      availableApps.push({ name: 'Google Maps', url: googleMapsUrl });
    }
  } catch (e) {
    // Ignore
  }

  // Sempre adicionar opção de abrir no navegador
  availableApps.push({ name: 'Google Maps (Navegador)', url: browserMapsUrl });

  // Se só tem uma opção, abrir direto
  if (availableApps.length === 1) {
    await Linking.openURL(availableApps[0].url);
    return;
  }

  // Mostrar menu de escolha
  Alert.alert(
    'Como Chegar',
    'Escolha o app de navegação:',
    [
      ...availableApps.map(app => ({
        text: app.name,
        onPress: () => Linking.openURL(app.url),
      })),
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]
  );
}
