# 💡 Dicas de Desenvolvimento - PraiaAgora Mobile

## 🎨 Personalizando o Design

### Alterar Cores do Tema
Edite `src/theme/index.ts`:

```typescript
export const theme = {
  colors: {
    primary: '#0ea5e9',      // Altere para sua cor primária
    primaryDark: '#0284c7',  // Versão mais escura
    secondary: '#06b6d4',    // Cor secundária
    // ... outras cores
  }
}
```

### Adicionar Nova Tela
1. Crie arquivo em `src/screens/main/MinhaTelaScreen.tsx`
2. Adicione no `RootNavigator.tsx`:

```typescript
<Stack.Screen 
  name="MinhaTela" 
  component={MinhaTelaScreen}
  options={{ title: 'Minha Tela' }}
/>
```

3. Navegue de qualquer tela:
```typescript
navigation.navigate('MinhaTela', { parametro: valor });
```

### Criar Novo Componente UI
1. Crie arquivo em `src/components/ui/MeuComponente.tsx`
2. Siga o padrão dos outros componentes:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface MeuComponenteProps {
  title: string;
  // ... outras props
}

export default function MeuComponente({ title }: MeuComponenteProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
  },
});
```

---

## 🔧 Adicionando Funcionalidades

### Novo Endpoint na API
1. Adicione no `src/services/api.ts`:

```typescript
async getMinhaFuncao(parametro: string) {
  const response = await this.api.get('/api/meu-endpoint', {
    params: { parametro },
  });
  return response.data;
}
```

2. Use em qualquer tela:
```typescript
import api from '../../services/api';

const dados = await api.getMinhaFuncao('valor');
```

### Adicionar ao Context
1. Edite o Context desejado (ex: `AuthContext.tsx`)
2. Adicione novo método:

```typescript
async minhaFuncao() {
  // lógica aqui
}
```

3. Exporte no provider:
```typescript
return (
  <AuthContext.Provider
    value={{
      // ... outros valores
      minhaFuncao,
    }}
  >
```

4. Use em qualquer tela:
```typescript
const { minhaFuncao } = useAuth();
await minhaFuncao();
```

---

## 🎯 Otimizações

### Lazy Loading de Imagens
```typescript
import { Image } from 'react-native';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  loadingIndicatorSource={require('./loading.png')}
/>
```

### Memoização de Componentes
```typescript
import React, { memo } from 'react';

const MeuComponente = memo(({ data }) => {
  return <View>{/* ... */}</View>;
});
```

### useMemo para Cálculos
```typescript
const dadosProcessados = useMemo(() => {
  return dados.map(item => processarItem(item));
}, [dados]);
```

### useCallback para Funções
```typescript
const handlePress = useCallback(() => {
  // lógica
}, [dependencias]);
```

---

## 🐛 Debugging

### Console.log no App
```typescript
console.log('Dados:', dados);
console.warn('Atenção!');
console.error('Erro:', error);
```

### React Native Debugger
1. Instale: `brew install react-native-debugger` (Mac)
2. Abra o app
3. No app mobile: Shake device → Debug

### Ver Logs em Tempo Real
```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

### Inspecionar Layout
No app: Shake device → Show Inspector

---

## 📦 Adicionando Pacotes

### Instalar Nova Biblioteca
```bash
npm install nome-do-pacote
```

### Bibliotecas Úteis Recomendadas

**UI/UX:**
```bash
npm install react-native-swiper          # Carrossel
npm install react-native-image-picker    # Galeria/câmera
npm install react-native-skeleton-content # Skeleton loaders
npm install lottie-react-native          # Animações Lottie
```

**Funcionalidades:**
```bash
npm install react-native-share           # Compartilhar
npm install react-native-camera          # Câmera avançada
npm install react-native-pdf             # Visualizar PDFs
npm install react-native-qrcode-scanner  # QR Code
```

**Análytics:**
```bash
npm install @react-native-firebase/analytics
npm install @amplitude/react-native
```

---

## 🎨 Animações

### Animação Simples
```typescript
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}, []);

return (
  <Animated.View style={{ opacity: fadeAnim }}>
    {/* conteúdo */}
  </Animated.View>
);
```

### Reanimated (Melhor Performance)
```bash
npm install react-native-reanimated
```

```typescript
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const offset = useSharedValue(0);

const handlePress = () => {
  offset.value = withSpring(offset.value + 10);
};
```

---

## 🌐 Internacionalização (i18n)

```bash
npm install i18n-js
```

```typescript
import { I18n } from 'i18n-js';

const i18n = new I18n({
  pt: {
    welcome: 'Bem-vindo',
    beaches: 'Praias',
  },
  en: {
    welcome: 'Welcome',
    beaches: 'Beaches',
  },
});

// Usar
<Text>{i18n.t('welcome')}</Text>
```

---

## 🧪 Testes

### Instalar Jest
```bash
npm install --save-dev jest @testing-library/react-native
```

### Exemplo de Teste
```typescript
import { render } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Clique" />);
    expect(getByText('Clique')).toBeTruthy();
  });
});
```

---

## 📱 Build & Deploy

### Configurar EAS
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build Android
```bash
eas build --platform android
```

### Build iOS
```bash
eas build --platform ios
```

### Submit para Stores
```bash
eas submit --platform android
eas submit --platform ios
```

---

## 🔥 Firebase

### Instalar Firebase
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging  # Para FCM
npm install @react-native-firebase/analytics  # Para Analytics
```

### Configurar Firebase
1. Baixe `google-services.json` (Android)
2. Baixe `GoogleService-Info.plist` (iOS)
3. Coloque na raiz do projeto
4. Configure em `app.json`

---

## ⚡ Performance

### Otimizar FlatList
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  // Otimizações
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Hermes Engine (Já Ativado)
Hermes melhora performance em Android:
- ✅ Startup mais rápido
- ✅ Menor uso de memória
- ✅ Tamanho reduzido do APK

---

## 🎓 Recursos de Aprendizado

### Documentação Oficial
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/

### Tutoriais
- YouTube: React Native Tutorial
- Udemy: React Native Course
- Frontend Masters

### Comunidade
- Reddit: r/reactnative
- Discord: Reactiflux
- Stack Overflow

---

## 🛡️ Segurança

### Nunca Commitar
```gitignore
.env
google-services.json
GoogleService-Info.plist
*.key
*.p12
```

### Usar Variáveis de Ambiente
```bash
npm install react-native-dotenv
```

```env
API_URL=http://192.168.1.100:8000
API_KEY=sua-chave-aqui
```

```typescript
import { API_URL } from '@env';
```

---

## 📊 Analytics Recomendados

### Google Analytics
```bash
npm install @react-native-firebase/analytics
```

### Amplitude
```bash
npm install @amplitude/react-native
```

### Mixpanel
```bash
npm install mixpanel-react-native
```

---

## 🎉 Dicas Finais

1. **Use TypeScript** - Evita bugs
2. **Componentes Pequenos** - Reutilizáveis
3. **Context API** - Estado global simples
4. **AsyncStorage** - Persistência local
5. **FlatList** - Para listas grandes
6. **Memo/useCallback** - Otimizações
7. **Error Boundaries** - Captura erros
8. **Loading States** - Feedback visual
9. **Pull-to-Refresh** - Atualizar dados
10. **Testes** - Qualidade do código

---

**💪 Bom desenvolvimento!**
