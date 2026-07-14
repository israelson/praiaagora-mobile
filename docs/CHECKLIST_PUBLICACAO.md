# ✅ Checklist de Publicação — Google Play

> Atualizado em: 14/07/2026 (conferido item a item no código/config atuais, não apenas planejado)
> 🔴 = bloqueia a publicação · 🟡 = importante, resolver antes de submeter · ✅ = já resolvido

---

## 🔴 0. SEGURANÇA — resolver antes de qualquer outra coisa

### 0.1 Senha do keystore de produção vazada publicamente
- [ ] `android/gradle.properties` está commitado no git **e o repositório é público no GitHub**
      (`israelson/praiaagora-mobile`), expondo `MYAPP_UPLOAD_STORE_PASSWORD` e
      `MYAPP_UPLOAD_KEY_PASSWORD` (`PraiaAgora@2026!`) em texto puro pra qualquer pessoa.
- [ ] Como o app **ainda não teve nenhum AAB de produção gerado/enviado**, é seguro gerar um
      keystore novo agora (trocar não quebra nada que já esteja publicado):
  ```bash
  keytool -genkey -v -keystore android/app/beachly-release.keystore \
    -alias beachly -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Depois de gerar o novo, **atualizar as fingerprints SHA-1/SHA-256 no Firebase e no
      Google Cloud OAuth** (ver item 4 abaixo — precisa ser feito de qualquer forma).
- [ ] Remover `android/gradle.properties` do controle de versão:
  ```bash
  git rm --cached android/gradle.properties
  echo "android/gradle.properties" >> .gitignore
  ```
- [ ] Mover as credenciais para fora do arquivo versionado — usar
      `~/.gradle/gradle.properties` (fora do repo) ou variáveis de ambiente lidas no `build.gradle`.
- [ ] Considerar remover o arquivo do **histórico** do git também (`git filter-repo` ou BFG),
      já que a senha antiga ficou exposta publicamente mesmo depois de removida do HEAD.

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

### 🔴 3.1 Nenhum AAB de produção foi gerado ainda
- [ ] Rodar `eas build --platform android --profile production` (depois de resolver o item 0.1)
- [ ] Baixar e testar o AAB/APK gerado em um device físico antes de subir na loja

### 🟡 3.2 Versão
- [ ] `versionCode` está em `1` e `versionName` em `"1.0.0"` — ok para o primeiro envio,
      só lembrar de incrementar em atualizações futuras

---

## 4. INTEGRAÇÕES

### 🔴 4.1 Firebase — SHA do keystore de produção NÃO está cadastrado
- [ ] Conferido agora: `android/app/google-services.json` **não tem nenhum
      `certificate_hash`** cadastrado — apesar de um commit anterior dizer "Firebase SHA
      added", isso não está refletido no arquivo atual. Login Google e outras features
      dependentes de SHA vão falhar em build assinado de produção.
- [ ] Depois de gerar o keystore novo (item 0.1), extrair SHA-1/SHA-256:
  ```bash
  keytool -exportcert -keystore android/app/beachly-release.keystore -alias beachly -rfc \
    | openssl x509 -noout -fingerprint -sha1
  ```
- [ ] Cadastrar no Firebase Console → Configurações do projeto → App Android → Adicionar fingerprint
- [ ] Baixar o `google-services.json` atualizado e substituir em `android/app/`

### 🔴 4.2 Google Cloud — OAuth Android Client com SHA de produção
- [ ] console.cloud.google.com → Credenciais → Android Client ID → adicionar o SHA-1 novo
      (o antigo, de debug, já foi removido no commit `1f62a58` — falta adicionar o de produção)

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

| Área | Status |
|---|---|
| 🔴 Senha do keystore vazada no GitHub público | **Ação imediata necessária** |
| 🔴 Firebase sem SHA de produção cadastrado | Bloqueia login Google em build assinado |
| 🔴 Nenhum AAB de produção gerado ainda | Bloqueia o upload |
| 🔴 Política de privacidade sem URL pública | Play Console exige |
| 🔴 Assets de store listing (screenshots, banner, descrições) | Não existem ainda |
| 🟡 Permissões não usadas no manifest | Limpeza recomendada |
| 🟡 Conta de desenvolvedor Google Play | Confirmar se já existe |
| ✅ OAuth, HTTPS, ícone/splash, nome do app, EAS, signing config | Resolvido |
