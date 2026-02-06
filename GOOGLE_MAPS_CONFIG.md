# Configuração do Google Maps

Chave de API do Google Maps configurada para o projeto PraiaAgora.

## Localização da Chave

### 1. Arquivo de Ambiente
`mobile/.env`
```bash
GOOGLE_MAPS_API_KEY=AIzaSyDavvE9VitYMiWJj5rN7x_KTzRQuTjuOlc
```

### 2. Configuração do Expo (app.json)

**iOS:**
```json
"ios": {
  "config": {
    "googleMapsApiKey": "AIzaSyDavvE9VitYMiWJj5rN7x_KTzRQuTjuOlc"
  }
}
```

**Android:**
```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "AIzaSyDavvE9VitYMiWJj5rN7x_KTzRQuTjuOlc"
    }
  }
}
```

## Uso no Código

### Com expo-location (React Native Maps)
```typescript
import MapView, { Marker } from 'react-native-maps';

<MapView
  initialRegion={{
    latitude: -27.5954,
    longitude: -48.5480,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  }}
>
  <Marker coordinate={{ latitude: beach.lat, longitude: beach.lon }} />
</MapView>
```

### Instalação necessária
```bash
npx expo install react-native-maps
```

## Segurança

- ✅ `.env` incluído no `.gitignore`
- ✅ Chave configurada em local seguro
- ⚠️ **IMPORTANTE:** Para produção, adicionar restrições na API do Google Cloud Console:
  - Restrição de aplicativo (iOS bundle ID / Android package name)
  - Restrição de API (apenas Maps SDK)
  - Limite de requisições diárias

## Serviços Disponíveis

Com esta chave você pode usar:
- Google Maps SDK (exibir mapas)
- Places API (buscar locais)
- Geocoding API (converter endereços)
- Directions API (calcular rotas)
- Distance Matrix API (calcular distâncias)

## Próximos Passos

1. Instalar `react-native-maps` quando for implementar mapa
2. Configurar restrições de segurança no Google Cloud Console
3. Implementar tela de mapa com praias próximas
4. Adicionar marcadores personalizados para cada praia
5. Implementar navegação para Google Maps externo
