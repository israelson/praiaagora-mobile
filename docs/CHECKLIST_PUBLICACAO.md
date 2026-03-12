# ✅ Checklist de Publicação — Google Play & App Store

> Siga na ordem. Cada item marcado com 🔴 bloqueia a publicação.
> Atualizado em: 12/03/2026

---

## 👇 PARAMOS AQUI — PRÓXIMO PASSO

### 🔴 3.1-b Firebase — baixar novo google-services.json
Após adicionar SHA-1 e SHA-256 no Firebase Console:
1. Baixar o novo `google-services.json`
2. Substituir: `cp ~/Downloads/google-services.json android/app/google-services.json`
3. Commitar: `git add android/app/google-services.json && git commit -m "fix: add production SHA to Firebase" && git push`

**SHAs do keystore `beachly-release.keystore` (alias: beachly):**
```
SHA-1:   8E:EF:B3:3D:B0:BE:3A:4F:9C:78:8A:B9:F4:6C:1D:A5:25:8E:01:66
SHA-256: A5:E6:78:D3:40:E1:4B:95:E0:AE:58:90:13:E3:58:5D:3C:A8:8A:65:A4:1E:28:75:FF:13:6C:B4:B6:DC:DA:FA
```
**Firebase:** console.firebase.google.com → projeto **praia-agora** → ⚙️ Configurações → App `com.beachly.app` → Adicionar impressão digital
**Google Cloud:** console.cloud.google.com → projeto **praia-agora** → APIs → Credenciais → Android Client ID → adicionar SHA-1

---

## STATUS ATUAL — 12/03/2026

---

## 1. CÓDIGO & CREDENCIAIS

### 🔴 1.1 Corrigir `oauth.ts` — placeholders de credenciais
- [ ] Abrir `src/services/oauth.ts`
- [ ] Substituir `YOUR_GOOGLE_CLIENT_ID` e `YOUR_FACEBOOK_APP_ID` pelas vars do `.env`:
  ```ts
  const GOOGLE_WEB_CLIENT_ID    = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
  const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!;
  const GOOGLE_IOS_CLIENT_ID    = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!;
  ```
- [ ] Testar login Google em device fisico com EAS dev build

### 🔴 1.2 Migrar API para HTTPS
- [ ] Provisionar domínio ou certificado SSL no servidor VPS (`76.13.232.232`)
  - Opção: Caddy ou Nginx + Let's Encrypt (gratuito)
- [ ] Atualizar `src/services/api.ts` linha 5:
  ```ts
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.praiaagora.com.br';
  ```
- [ ] Adicionar `EXPO_PUBLIC_API_URL=https://seu-dominio.com` no `.env`
- [ ] Testar todas as chamadas de API com a URL nova

### 🟡 1.3 Remover permissões desnecessárias
- [ ] Abrir `android/app/src/main/AndroidManifest.xml`
- [ ] Remover estas linhas (se não houver uso real):
  ```xml
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  ```
- [ ] Verificar no Play Console se alguma permission exige declaração de uso

---

## 2. IDENTIDADE VISUAL & ASSETS

### 🔴 2.1 Definir nome final do app
- [ ] Decidir: **PraiaAgora** ou **Beachly**?
- [ ] Atualizar `app.json` → `expo.name`
- [ ] Atualizar `android/app/src/main/res/values/strings.xml` → `app_name`
- [ ] Atualizar `package.json` → `name`

### 🔴 2.2 Criar e configurar ícone do app
- [ ] Criar `assets/icon.png` — **1024×1024 px**, fundo opaco, sem transparência, PNG
- [ ] Criar `assets/adaptive-icon.png` — **1024×1024 px**, fundo transparente (foreground)
- [ ] Criar `assets/adaptive-icon-bg.png` — cor de fundo (ou usar cor hex)
- [ ] Adicionar em `app.json`:
  ```json
  "icon": "./assets/icon.png",
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0ea5e9"
    }
  }
  ```
- [ ] Verificar que o ícone está correto rodando `npx expo start` e vendo no Expo Go

### 🔴 2.3 Criar splash screen
- [ ] Criar `assets/splash.png` — **1284×2778 px** (seguro para todos os devices), PNG
- [ ] Adicionar em `app.json`:
  ```json
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#0ea5e9"
  }
  ```

---

## 3. CONFIGURAÇÃO DO BUILD

### 🔴 3.1 Gerar Keystore de produção (Android)
- [ ] Rodar:
  ```bash
  keytool -genkey -v -keystore praiaagora-release.keystore \
    -alias praiaagora -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Guardar o `.keystore` em local seguro (NUNCA commitar no git)
- [ ] Adicionar no `.gitignore`: `*.keystore`
- [ ] Configurar em `android/gradle.properties`:
  ```properties
  MYAPP_UPLOAD_STORE_FILE=praiaagora-release.keystore
  MYAPP_UPLOAD_KEY_ALIAS=praiaagora
  MYAPP_UPLOAD_STORE_PASSWORD=SUA_SENHA
  MYAPP_UPLOAD_KEY_PASSWORD=SUA_SENHA
  ```
- [ ] Atualizar `android/app/build.gradle` → `signingConfigs.release`:
  ```groovy
  release {
      storeFile file(MYAPP_UPLOAD_STORE_FILE)
      storePassword MYAPP_UPLOAD_STORE_PASSWORD
      keyAlias MYAPP_UPLOAD_KEY_ALIAS
      keyPassword MYAPP_UPLOAD_KEY_PASSWORD
  }
  ```
- [ ] Substituir `signingConfig signingConfigs.debug` por `signingConfig signingConfigs.release` no bloco `release`

### 🟡 3.2 Configurar EAS Build
- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Linkar projeto: `eas init`
- [ ] Copiar o `projectId` gerado para `app.json`:
  ```json
  "extra": {
    "eas": { "projectId": "SEU_PROJECT_ID" }
  }
  ```
- [ ] Subir segredos no EAS:
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.praiaagora.com.br
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value SEU_ID
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value SEU_ID
  eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value SEU_ID
  ```

### 🟡 3.3 Atualizar versão
- [ ] Incrementar `versionCode` em `android/app/build.gradle` (ex: `2`)
- [ ] Atualizar `versionName` (ex: `"1.1.0"`)
- [ ] Sincronizar com `app.json` → `expo.version`

---

## 4. INTEGRAÇÕES

### 🔴 4.1 Firebase — adicionar SHA do keystore de produção
- [ ] Extrair SHA-1 e SHA-256 do keystore de produção:
  ```bash
  keytool -list -v -keystore praiaagora-release.keystore -alias praiaagora
  ```
- [ ] Acessar Firebase Console → Projeto → Configurações → App Android
- [ ] Adicionar as fingerprints SHA-1 e SHA-256
- [ ] Baixar novo `google-services.json` e substituir em `android/app/`

### 🔴 4.2 Google Cloud — OAuth redirect com keystore de produção
- [ ] Acessar [console.cloud.google.com](https://console.cloud.google.com)
- [ ] APIs e Serviços → Credenciais → Android Client ID
- [ ] Adicionar SHA-1 do keystore de **produção** (diferente do debug)
- [ ] Salvar e aguardar propagação (~5 min)

### 🟡 4.3 Push Notifications (Expo)
- [ ] Confirmar que `projectId` está no `app.json` (item 3.2)
- [ ] Testar envio de push em device físico com build de produção

---

## 5. GOOGLE PLAY

### 5.1 Conta de Desenvolvedor
- [ ] Criar conta em [play.google.com/console](https://play.google.com/console) (taxa única $25)
- [ ] Verificar identidade (pode levar 1-3 dias)

### 5.2 Criar app no Play Console
- [ ] Novo app → definir nome, idioma padrão (Português - Brasil), tipo (App), grátis/pago
- [ ] Preencher **Política de Privacidade** (URL pública obrigatória)

### 5.3 Store Listing (Ficha da loja)
- [ ] **Descrição curta** — até 80 caracteres
- [ ] **Descrição completa** — até 4000 caracteres
- [ ] **Ícone** — 512×512 px, PNG, sem transparência
- [ ] **Feature Graphic** (banner) — 1024×500 px, JPG ou PNG
- [ ] **Screenshots** — mínimo 2 por tipo de tela:
  - Telefone: 16:9 ou 9:16, mínimo 320px, máximo 3840px
  - (Opcional) Tablet 7", Tablet 10"
- [ ] Categoria (ex: Viagem/Esportes), Tags, Contato (email obrigatório)

### 5.4 Classificação de Conteúdo
- [ ] Preencher questionário (conteúdo do app)
- [ ] Aguardar classificação automática (LIVRE ou MAIOR_10, etc.)

### 5.5 Público-alvo e conteúdo
- [ ] Definir faixa etária (se +13 anos, não precisa de COPPA)
- [ ] Declarar se o app é direcionado a crianças

### 5.6 Anúncios e compras
- [ ] Declarar se contém compras dentro do app (In-App Purchases)
- [ ] Declarar se exibe anúncios

### 5.7 Segurança dos dados
- [ ] Preencher formulário de coleta de dados:
  - Localização (coletada, usada para funcionalidade do app)
  - Nome/email (coletados para conta)
  - Fotos/mídia (se avatar)

### 5.8 Gerar e subir AAB
- [ ] Gerar bundle de produção:
  ```bash
  # Via EAS (recomendado)
  eas build --platform android --profile production

  # Ou local
  cd android && ./gradlew bundleRelease
  # Saída: android/app/build/outputs/bundle/release/app-release.aab
  ```
- [ ] Fazer upload no Play Console → Testes Internos (testar antes de ir para Produção)
- [ ] Adicionar testadores internos e validar o build
- [ ] Promover para Produção quando aprovado

---

## 6. APPLE APP STORE (iOS)

### 6.1 Conta Apple Developer
- [ ] Criar/ativar conta em [developer.apple.com](https://developer.apple.com) ($99/ano)

### 6.2 Certificados e Provisioning
- [ ] Via EAS: `eas credentials --platform ios` (gerencia automaticamente)
- [ ] Confirmar `bundleIdentifier: "com.beachly.app"` no `app.json`

### 6.3 App Store Connect
- [ ] Criar novo app em [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- [ ] Preencher store listing (mesmos assets do Play, com tamanhos diferentes)
- [ ] Screenshots iPhone: 6.7" obrigatório (1290×2796 px)
- [ ] Screenshots iPad: (opcional mas recomendado)

### 6.4 Gerar IPA de produção
- [ ] `eas build --platform ios --profile production`
- [ ] Submeter: `eas submit --platform ios`
- [ ] Preencher informações de revisão no App Store Connect
- [ ] Aguardar revisão da Apple (1-3 dias úteis)

---

## 7. PÓS-PUBLICAÇÃO

- [ ] Criar URL pública da Política de Privacidade (ex: GitHub Pages, site próprio)
- [ ] Configurar monitoramento de erros (Sentry, Bugsnag, ou Expo Telemetry)
- [ ] Configurar analytics (Firebase Analytics já está no projeto)
- [ ] Planejar estratégia de atualizações (EAS Update para OTA, versão nova para mudanças nativas)
- [ ] Responder avaliações dos usuários na loja

---

## RESUMO DO STATUS ATUAL — 12/03/2026

| Área | Status | Prioridade |
|---|---|---|
| OAuth credentials | ✅ Usando EXPO_PUBLIC_* do .env | ✅ FEITO |
| Remover Facebook OAuth | ✅ Removido de Login e Register | ✅ FEITO |
| Erros TypeScript | ✅ Zero erros | ✅ FEITO |
| API com env var | ✅ EXPO_PUBLIC_API_URL configurado | ✅ FEITO |
| API HTTPS (domínio real) | ⚠️ Ainda usando IP — falta SSL no VPS | 🔴 ANTES DO RELEASE |
| Keystore produção | ✅ beachly-release.keystore gerado e configurado | ✅ FEITO |
| Ícone do app | ✅ icon.png + adaptive-icon.png (Icon Kitchen) | ✅ FEITO |
| Splash screen | ✅ splash.png 1284×2778 configurado | ✅ FEITO |
| Nome do app | ✅ Beachly em todos os arquivos | ✅ FEITO |
| EAS projectId | ✅ 9105dae8-c758-4b52-8250-cf5d0e0e3712 | ✅ FEITO |
| Firebase SHA prod | ⏳ SHAs calculados — falta adicionar no console | 🔴 PRÓXIMO |
| OAuth SHA prod (Google Cloud) | ⏳ Falta adicionar SHA-1 no Android Client ID | 🔴 PRÓXIMO |
| Novo google-services.json | ⏳ Baixar após adicionar SHAs | 🔴 PRÓXIMO |
| Build AAB produção | ❌ Não gerado | 🔴 DEPOIS DO FIREBASE |
| Política de Privacidade | ❌ Não existe | 🟡 PLAY CONSOLE |
| Store listing / screenshots | ❌ Não criado | 🟡 PLAY CONSOLE |
| Permissões desnecessárias | ⚠️ RECORD_AUDIO, SYSTEM_ALERT_WINDOW no manifest | 🟡 MÉDIO |
| versionCode | ⚠️ Em 1 (ok para 1ª publicação) | 🟢 OK |

---

## COMMITS FEITOS (branch restore/2026-02-09)

| Hash | Descrição |
|---|---|
| `0dd203e` | fix: use env vars for OAuth/API, remove Facebook OAuth, fix TS errors |
| `fd47ab2` | build: add production keystore signing config (beachly-release.keystore) |
| `973525c` | feat: add icon, adaptive-icon and splash assets; update app.json |
| `20da1e1` | feat: replace icons with Icon Kitchen assets (all densities) |
| `38093d6` | feat: link EAS project (projectId: 9105dae8-c758-4b52-8250-cf5d0e0e3712) |
