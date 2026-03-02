# 🌊 Beachly Mobile App

Aplicativo mobile moderno e elegante para o sistema Beachly - encontre as melhores praias de Santa Catarina em tempo real.

## ✨ Características

### 🎨 Design Moderno
- Interface limpa e agradável aos olhos
- Gradientes suaves em tons de azul oceano
- Animações fluidas e responsivas
- Componentes UI reutilizáveis e consistentes
- Temas personalizados com Design System completo

### 🚀 Funcionalidades Principais

#### 🏖️ Exploração de Praias
- Lista completa de praias de Santa Catarina
- Busca e filtros por cidade
- Visualização de praias próximas usando geolocalização
- Detalhes completos: temperatura, qualidade da água, lotação
- Recomendações personalizadas

#### ⭐ Favoritos
- Marque suas praias favoritas
- Acesso rápido às praias que você mais gosta
- Sincronização com o backend

#### ✅ Check-ins
- Faça check-in nas praias que está visitando
- Informe o nível de lotação em tempo real
- Adicione comentários sobre sua experiência
- Contribua com a comunidade

#### 📊 Inteligência de Lotação
- Veja a lotação atual das praias
- Previsões de lotação baseadas em IA
- Níveis de confiança das predições
- Histórico de lotação

#### 🤝 Parceiros B2B
- Descubra hotéis, restaurantes e escolas de surf próximos
- Informações de contato e localização
- Integração com telefone e mapas

#### 🗺️ Mapas
- Visualize praias no mapa
- Navegação integrada
- Sua localização em tempo real

#### 🔔 Notificações Push
- Alertas sobre suas praias favoritas
- Notificações de mudanças de status
- Avisos de condições especiais

#### 👤 Perfil
- Estatísticas pessoais (check-ins, praias visitadas)
- Histórico de atividades
- Configurações personalizadas

## 🛠️ Tecnologias

### Core
- **React Native** 0.73.4 - Framework mobile
- **Expo** ~50.0.0 - Plataforma de desenvolvimento
- **TypeScript** 5.1.3 - Tipagem estática
- **React** 18.2.0 - Library UI

### Navegação
- **React Navigation** 6.x - Sistema de navegação
  - Native Stack Navigator
  - Bottom Tabs Navigator
  - Transições suaves

### Estado Global
- **Context API** - Gerenciamento de estado
  - AuthContext (autenticação)
  - FavoritesContext (favoritos)
  - NotificationContext (notificações)

### UI & Styling
- **Expo Linear Gradient** - Gradientes suaves
- **Ionicons** - Ícones modernos
- **Design System Custom** - Tema personalizado

### APIs & Dados
- **Axios** - Cliente HTTP
- **AsyncStorage** - Persistência local
- **JWT** - Autenticação segura

### Recursos Nativos
- **Expo Location** - Geolocalização
- **React Native Maps** - Integração com mapas
- **Expo Notifications** - Push notifications
- **Expo Device** - Informações do dispositivo

## 📱 Screenshots

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │  │                     │
│      🌊 Login       │  │    🏠 Início       │  │   🔍 Explorar      │
│                     │  │                     │  │                     │
│   Beachly           │  │  Olá, João! 👋     │  │  [Buscar...]       │
│                     │  │                     │  │                     │
│   [Email]           │  │  ┌───┬───┬───┐     │  │  🏖️ Praia 1        │
│   [Senha]           │  │  │ 🗺│ 🔍│ ❤│     │  │  🏖️ Praia 2        │
│                     │  │  └───┴───┴───┘     │  │  🏖️ Praia 3        │
│   [  Entrar  ]      │  │                     │  │                     │
│   [ Criar Conta ]   │  │  Praias Próximas    │  │                     │
│                     │  │  🏖️ Praia A         │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- App Expo Go no celular (iOS/Android)

### Instalação

1. **Clone o repositório:**
```bash
cd /caminho/para/projeto/mobile
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure o backend:**
Edite `src/services/api.ts` e altere `API_BASE_URL` para o IP do seu backend:
```typescript
const API_BASE_URL = 'http://SEU_IP:8000';
```

4. **Inicie o app:**
```bash
npm start
```

5. **Execute no dispositivo:**
- Escaneie o QR code com o app Expo Go (Android)
- Escaneie com a câmera nativa (iOS)

### Comandos Disponíveis

```bash
npm start          # Inicia o Expo Dev Server
npm run android    # Abre no emulador Android
npm run ios        # Abre no simulador iOS
npm run web        # Abre no navegador (experimental)
```

## 📁 Estrutura do Projeto

```
mobile/
├── App.tsx                          # Componente raiz
├── app.json                         # Configurações Expo
├── package.json                     # Dependências
├── tsconfig.json                    # Config TypeScript
├── babel.config.js                  # Config Babel
│
└── src/
    ├── components/                  # Componentes reutilizáveis
    │   ├── ui/                      # Componentes UI base
    │   │   ├── Button.tsx           # Botão customizado
    │   │   ├── Card.tsx             # Card container
    │   │   ├── Input.tsx            # Input de texto
    │   │   └── Badge.tsx            # Badge de status
    │   │
    │   └── beach/                   # Componentes de praia
    │       └── BeachCard.tsx        # Card de praia
    │
    ├── contexts/                    # Contextos React
    │   ├── AuthContext.tsx          # Autenticação
    │   ├── FavoritesContext.tsx     # Favoritos
    │   └── NotificationContext.tsx  # Notificações
    │
    ├── navigation/                  # Sistema de navegação
    │   └── RootNavigator.tsx        # Navegador principal
    │
    ├── screens/                     # Telas do app
    │   ├── auth/                    # Telas de autenticação
    │   │   ├── LoginScreen.tsx      # Login
    │   │   └── RegisterScreen.tsx   # Registro
    │   │
    │   └── main/                    # Telas principais
    │       ├── HomeScreen.tsx       # Tela inicial
    │       ├── ExploreScreen.tsx    # Explorar praias
    │       ├── FavoritesScreen.tsx  # Praias favoritas
    │       ├── ProfileScreen.tsx    # Perfil do usuário
    │       ├── BeachDetailScreen.tsx # Detalhes da praia
    │       ├── CheckInScreen.tsx    # Fazer check-in
    │       ├── MapScreen.tsx        # Mapa de praias
    │       └── PartnerDetailScreen.tsx # Detalhes do parceiro
    │
    ├── services/                    # Serviços e APIs
    │   └── api.ts                   # Cliente API REST
    │
    └── theme/                       # Design System
        └── index.ts                 # Definições de tema
```

## 🎨 Design System

### Cores
```typescript
colors: {
  primary: '#0ea5e9',        // Azul céu
  primaryDark: '#0284c7',    // Azul escuro
  secondary: '#06b6d4',      // Ciano
  accent: '#f59e0b',         // Âmbar
  
  // Estados
  success: '#10b981',        // Verde
  warning: '#f59e0b',        // Laranja
  error: '#ef4444',          // Vermelho
  
  // Lotação
  crowdLow: '#10b981',       // Verde
  crowdModerate: '#f59e0b',  // Laranja
  crowdHigh: '#f97316',      // Laranja escuro
  crowdVeryHigh: '#ef4444',  // Vermelho
}
```

### Espaçamento
```typescript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

### Tipografia
```typescript
fontSize: {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}
```

## 🔐 Autenticação

O app utiliza JWT (JSON Web Tokens) para autenticação:

1. **Login/Registro:** Usuário envia credenciais
2. **Tokens:** Backend retorna access_token e refresh_token
3. **Armazenamento:** Tokens salvos no AsyncStorage
4. **Requisições:** access_token enviado no header Authorization
5. **Refresh:** refresh_token usado para renovar access_token expirado
6. **Logout:** Tokens removidos do storage

## 📡 Integração com Backend

### Endpoints Utilizados

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

#### Praias
- `GET /api/beaches` - Listar praias
- `GET /api/beaches/:id` - Detalhes da praia
- `GET /api/beaches/nearby` - Praias próximas

#### Check-ins
- `POST /api/beaches/:id/checkins` - Criar check-in
- `GET /api/checkins/me` - Meus check-ins

#### Favoritos
- `GET /api/favorites` - Listar favoritos
- `POST /api/favorites/:id` - Adicionar favorito
- `DELETE /api/favorites/:id` - Remover favorito

#### Inteligência de Lotação
- `GET /api/beaches/:id/crowd/prediction` - Previsão de lotação
- `GET /api/beaches/:id/crowd/history` - Histórico de lotação

#### Parceiros
- `GET /api/beaches/:id/partners/nearby` - Parceiros próximos
- `GET /api/partners/:id` - Detalhes do parceiro

#### Usuário
- `GET /api/users/me` - Perfil do usuário
- `PATCH /api/users/me` - Atualizar perfil
- `GET /api/users/me/stats` - Estatísticas do usuário

#### Notificações
- `POST /api/notifications/register` - Registrar token FCM

## 🔔 Notificações Push

O app usa Expo Notifications e Firebase Cloud Messaging:

1. **Registro:** App solicita permissão ao usuário
2. **Token:** Expo gera um push token
3. **Envio:** Token enviado para o backend
4. **Recebimento:** Backend envia notificações via Firebase
5. **Display:** App exibe notificações em tempo real

## 🗺️ Geolocalização

Funcionalidades de localização:

- **Permissões:** Solicitadas ao usuário
- **Localização Atual:** GPS do dispositivo
- **Praias Próximas:** Cálculo de distância usando Haversine
- **Mapas:** Integração com Google Maps
- **Navegação:** Direções para praias

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com cobertura
npm run test:coverage
```

## 📦 Build para Produção

### Android
```bash
# Build APK
expo build:android -t apk

# Build AAB (Google Play)
expo build:android -t app-bundle
```

### iOS
```bash
# Build IPA
expo build:ios
```

### EAS Build (Recomendado)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## 🚀 Publicação

### Google Play Store
1. Build AAB com EAS
2. Criar conta no Google Play Console
3. Upload do AAB
4. Preencher informações da store
5. Submeter para revisão

### Apple App Store
1. Build IPA com EAS
2. Criar conta no Apple Developer
3. Configurar App Store Connect
4. Upload via Transporter
5. Submeter para revisão

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de conexão com backend:**
- Verifique o IP em `src/services/api.ts`
- Certifique-se que backend está rodando
- Celular deve estar na mesma rede Wi-Fi

**Mapas não carregam:**
- Configure API Key do Google Maps
- Adicione chave em `app.json`

**Notificações não funcionam:**
- Verifique permissões no dispositivo
- Configure Firebase corretamente
- Teste em dispositivo físico (não funciona em simulador)

**Build falha:**
- Limpe cache: `expo start -c`
- Delete node_modules: `rm -rf node_modules && npm install`
- Atualize Expo: `npm install expo@latest`

## 📝 Boas Práticas

### Código
- TypeScript para type safety
- Componentes funcionais com Hooks
- Context API para estado global
- Componentes reutilizáveis
- Separação de concerns

### Performance
- Lazy loading de imagens
- Memoização com useMemo/useCallback
- FlatList para listas longas
- Debounce em buscas
- Otimização de re-renders

### Segurança
- Tokens armazenados de forma segura
- HTTPS apenas
- Validação de inputs
- Sanitização de dados

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

Desenvolvido com ❤️ pela equipe Beachly

## 📞 Suporte

- Email: suporte@beachly.com.br
- Website: https://beachly.com.br
- Discord: https://discord.gg/beachly

---

**🌊 Beachly - Encontre a praia perfeita! 🏖️**
