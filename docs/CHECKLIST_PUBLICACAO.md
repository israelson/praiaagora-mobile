# ✅ Checklist de Publicação — Google Play

> Atualizado em: 14/07/2026 (conferido item a item no código/config atuais, não apenas planejado)
> 🔴 = bloqueia a publicação · 🟡 = importante, resolver antes de submeter · ✅ = já resolvido

---

## 🔴 0. SEGURANÇA — resolver antes de qualquer outra coisa

### ✅ 0.1 Senha do keystore de produção vazada publicamente — resolvido em 15/07/2026
- [x] Keystore local antigo (usado só pra build local via `gradlew`) tinha a senha
      (`PraiaAgora@2026!`) exposta no git. Gerado um keystore local novo
      (`android/app/beachly-release.keystore`), senha nova fora do repo.
- [x] `android/gradle.properties` não tem mais as senhas em texto puro — só
      `MYAPP_UPLOAD_STORE_FILE` e `MYAPP_UPLOAD_KEY_ALIAS`. Senhas novas estão em
      `~/.gradle/gradle.properties` (fora do repo, permissão 600).
- [x] **Descoberto durante o processo**: o build de produção real (`eas build`) não usa
      esse keystore local — o EAS já tinha keystores próprios, gerenciados remotamente
      pela Expo. Existem múltiplas "Build Credentials" no projeto (`FRtgvfeI3i` e
      `ETP-A9KoVf`); a que o `eas build --profile production` de fato usa é a marcada
      `(default)`, confirmada pelo log do build: **`ETP-A9KoVf`**. Nenhuma delas nunca
      esteve no git. Decisão: manter o keystore do EAS (`ETP-A9KoVf`) como o oficial de
      produção. O keystore local gerado nesta sessão fica sem uso (só serviria pra build
      local via `gradlew`, que hoje não é o fluxo usado).
- [x] Fingerprints SHA-1/SHA-256 no Firebase e no Google Cloud OAuth atualizadas com o
      SHA do keystore `ETP-A9KoVf` (ver item 4 abaixo) — depois de duas tentativas
      erradas (local, depois `FRtgvfeI3i`) até confirmar qual é o real.
- [ ] Ainda pendente: **considerar remover a senha antiga do histórico do git**
      (`git filter-repo` ou BFG) — ela ficou exposta publicamente, e como o repo é
      público qualquer um que já tenha clonado viu. Não é bloqueante (a senha antiga
      não protege o keystore que assina de verdade, que é o do EAS), mas é limpeza
      recomendada — reescreve histórico e exige force-push, fazer só se decidido.

---

## 1. CÓDIGO & CREDENCIAIS

| Item | Status |
|---|---|
| OAuth via `.env` (sem placeholders) | ✅ resolvido |
| API em HTTPS (`api.beachly.com.br`, Railway) | ✅ resolvido (corrigido hoje) |
| EAS secret `EXPO_PUBLIC_API_URL` sincronizada | ✅ resolvido (corrigido hoje) |

### 🟡 1.1 Permissões desnecessárias no manifest
- [ ] `android/app/src/main/AndroidManifest.xml` ainda declara:
  - `RECORD_AUDIO` — **sem uso no código**, remover
  - `SYSTEM_ALERT_WINDOW` — **sem uso no código**, remover
  - `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — conferir se o `expo-image-picker`
    atual (Android 13+/scoped storage) ainda precisa disso ou se já auto-declara o necessário
- [ ] Permissões usadas de fato hoje: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`,
      `INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`

---

## 2. IDENTIDADE VISUAL & ASSETS

| Item | Status |
|---|---|
| Nome do app consistente (Beachly em app.json/strings.xml/package.json) | ✅ resolvido |
| Ícone (`assets/icon.png`) configurado no app.json | ✅ resolvido |
| Adaptive icon configurado | ✅ resolvido |
| Splash screen configurada | ✅ resolvido |

---

## 3. CONFIGURAÇÃO DO BUILD

| Item | Status |
|---|---|
| Keystore de produção gerado | ⚠️ existe, mas **precisa ser regerado** (item 0.1) |
| `signingConfigs.release` ligado ao build de release | ✅ resolvido |
| EAS projectId linkado no app.json | ✅ resolvido |
| EAS build profile `production` gera AAB (`app-bundle`) | ✅ resolvido |
| EAS secrets (API URL, Google OAuth) | ✅ resolvido |

### ✅ 3.1 Primeiro AAB de produção gerado — resolvido em 15/07/2026
- [x] `eas build --platform android --profile production` rodou com sucesso, assinado
      com o keystore real do EAS (`ETP-A9KoVf`).
  ```
  Build ID: 12a238d0-7eff-4ce9-88a5-d7f7fb187897
  AAB: https://expo.dev/artifacts/eas/Y0d6c5hh_i19fRfBiapXZhhi3apIv4aZuczxU4j3-Zg.aab
  ```
- [ ] Ainda falta: **baixar e testar o AAB/APK em um device físico** antes de subir na
      loja. Como o EAS gera `.aab` (formato da Play Store, não instalável direto), pra
      testar localmente é mais fácil gerar um APK via profile `preview` (`buildType: apk`
      no `eas.json`) ou usar `bundletool` pra extrair um APK instalável a partir do `.aab`.

### 🟡 3.2 Versão
- [ ] `versionCode` está em `1` e `versionName` em `"1.0.0"` — ok para o primeiro envio,
      só lembrar de incrementar em atualizações futuras

---

## 4. INTEGRAÇÕES

### ✅ 4.1 Firebase — SHA do keystore de produção — resolvido em 15/07/2026
- [x] `android/app/google-services.json` atualizado com `certificate_hash:
      f3b39cf277fc6257a1fed38ecb4ce4c46387f929` — SHA-1 do keystore `ETP-A9KoVf`
      (o que o `eas build --profile production` realmente usa, confirmado pelo
      log do build).

### ✅ 4.2 Google Cloud — OAuth Android Client com SHA de produção — resolvido em 15/07/2026
- [x] Client "beachlyandroid" (`652160767969-s944hv6p2a8...`) atualizado em
      console.cloud.google.com/apis/credentials com o SHA-1 de `ETP-A9KoVf`.
      Google avisa que a propagação pode levar de 5 min a algumas horas — testar
      login Google só depois desse prazo.

---

## 5. GOOGLE PLAY CONSOLE (fora do repositório — ações manuais)

### 5.1 Conta de Desenvolvedor
- [ ] Confirmar se já existe conta em play.google.com/console (taxa única $25) — **não verificável a partir daqui**

### 5.2 Política de Privacidade — URL pública
- [ ] Hoje só existe uma tela **dentro do app** (`PrivacyScreen.tsx`), sem URL pública.
      Play Console **exige uma URL pública**. Opções rápidas: GitHub Pages, uma página simples
      em `beachly.com.br/privacidade`, ou Notion/site público.

### 5.3 Store Listing (ficha da loja) — nada disso existe no repo ainda
- [ ] Descrição curta (até 80 caracteres)
- [ ] Descrição completa (até 4000 caracteres)
- [ ] Ícone 512×512 px PNG sem transparência (diferente do ícone do app em si)
- [ ] Feature Graphic (banner) 1024×500 px
- [ ] Screenshots — mínimo 2, telefone (9:16 ou 16:9)
- [ ] Categoria, tags, e-mail de contato

### 5.4 Classificação de conteúdo, público-alvo, anúncios/compras
- [ ] Preencher questionário de classificação de conteúdo
- [ ] Declarar faixa etária / se é direcionado a crianças
- [ ] Declarar que não há anúncios nem compras in-app (confirmar se isso ainda é verdade)

### 5.5 Formulário de Segurança dos Dados (Data Safety)
- [ ] Declarar coleta de: localização, e-mail/nome (conta), foto de perfil (avatar),
      dados de uso (check-ins, favoritos)

### 5.6 Upload
- [ ] Subir o AAB gerado (item 3.1) em **Teste interno** primeiro, validar, depois promover
      para produção

---

## RESUMO DO STATUS ATUAL

> Atualizado em: 15/07/2026

| Área | Status |
|---|---|
| ✅ Keystore de produção oficial identificado (é o do EAS, `FRtgvfeI3i`) | Nunca foi exposto, mantido como está |
| ✅ Firebase + Google Cloud OAuth com SHA do keystore do EAS | Resolvido hoje |
| ✅ Primeiro AAB de produção gerado (build `12a238d0`) | Resolvido hoje — falta testar em device físico antes de subir na loja |
| 🔴 Política de privacidade sem URL pública | Play Console exige |
| 🔴 Assets de store listing (screenshots, banner, descrições) | Não existem ainda |
| 🟡 Permissões não usadas no manifest | Limpeza recomendada |
| 🟡 Conta de desenvolvedor Google Play | Confirmar se já existe |
| 🟢 Senha antiga ainda no histórico do git | Não bloqueia (keystore que ela protegia foi apagado); considerar limpar histórico depois |
| ✅ OAuth, HTTPS, ícone/splash, nome do app, EAS, signing config | Resolvido |
