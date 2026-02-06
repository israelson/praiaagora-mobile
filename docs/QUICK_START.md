# ⚡ Guia Rápido - PraiaAgora Mobile

## 🚀 Início Rápido (5 minutos)

### 1️⃣ Instalar Dependências
```bash
cd mobile
npm install
```
✅ **Status: Concluído!**

### 2️⃣ Configurar IP do Backend
Abra o arquivo: `mobile/src/services/api.ts`

Linha 5, altere para o IP do seu computador:
```typescript
const API_BASE_URL = 'http://192.168.1.100:8000';
//                          ^^^^^^^^^^^^^^ SEU IP AQUI
```

**Como descobrir meu IP?**
```bash
# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

### 3️⃣ Garantir que Backend está Rodando
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4️⃣ Iniciar o App Mobile
```bash
cd mobile
npm start
```

### 5️⃣ Instalar Expo Go no Celular
- **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS:** https://apps.apple.com/app/expo-go/id982107779

### 6️⃣ Escanear QR Code
- Aparecer um QR code no terminal
- Abrir app **Expo Go** no celular
- Escanear o QR code
- App abrirá automaticamente! 🎉

---

## 📱 Testando o App

### Login de Teste
```
Email: teste@praiaagora.com
Senha: 123456
```

Ou crie uma nova conta clicando em "Criar Conta"

### Funcionalidades para Testar

1. **Login/Registro** ✅
   - Tela de login com gradiente
   - Criar nova conta

2. **Home** 🏠
   - Ver praias próximas (permite localização)
   - Ver recomendações
   - Quick actions (Mapa, Buscar, Favoritas)

3. **Explorar** 🔍
   - Buscar praias por nome
   - Filtrar por cidade
   - Ver todas as praias

4. **Detalhes da Praia** 🏖️
   - Ver temperatura, qualidade da água
   - Ver nível de lotação
   - Ver infraestrutura
   - Adicionar aos favoritos ⭐

5. **Check-in** ✅
   - Informar lotação da praia
   - Adicionar comentário
   - Contribuir com a comunidade

6. **Favoritos** ❤️
   - Ver suas praias favoritas
   - Remover dos favoritos

7. **Parceiros** 🤝
   - Ver hotéis, restaurantes próximos
   - Ver detalhes do parceiro
   - Ligar ou visitar website

8. **Mapa** 🗺️
   - Ver praias no mapa
   - Ver sua localização

9. **Perfil** 👤
   - Ver suas estatísticas
   - Total de check-ins
   - Praias visitadas

10. **Notificações** 🔔
    - Permitir notificações
    - Receber alertas

---

## 🎨 Design

### Cores Principais
- **Primary:** #0ea5e9 (Azul céu)
- **Secondary:** #06b6d4 (Ciano)
- **Success:** #10b981 (Verde)
- **Warning:** #f59e0b (Laranja)
- **Error:** #ef4444 (Vermelho)

### Fontes
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Espaçamento
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

---

## 🐛 Problemas Comuns

### "Não consigo conectar ao backend"
✅ **Solução:**
1. Verifique se backend está rodando
2. Verifique o IP em `src/services/api.ts`
3. Celular e computador devem estar na **mesma rede Wi-Fi**
4. Firewall pode estar bloqueando - desabilite temporariamente

### "Mapas não aparecem"
✅ **Solução:**
1. Google Maps API requer configuração
2. Por enquanto, use em dispositivo físico
3. Emuladores podem ter problemas com mapas

### "Notificações não funcionam"
✅ **Solução:**
1. Notificações não funcionam em simulador
2. Use dispositivo físico
3. Permita notificações quando solicitado

### "App não carrega"
✅ **Solução:**
1. Limpe cache: `npm start -- --clear`
2. Reinstale dependências: `rm -rf node_modules && npm install`
3. Verifique conexão de internet

---

## 📊 Estrutura de Arquivos (Simplificada)

```
mobile/
├── App.tsx                  # Componente raiz
├── src/
│   ├── screens/             # 10 telas
│   │   ├── auth/            # Login, Register
│   │   └── main/            # Home, Explore, etc
│   ├── components/          # 6 componentes
│   │   ├── ui/              # Button, Card, Input, Badge
│   │   └── beach/           # BeachCard
│   ├── contexts/            # 3 contextos
│   │   ├── AuthContext      # Autenticação
│   │   ├── FavoritesContext # Favoritos
│   │   └── NotificationContext # Notificações
│   ├── navigation/          # Navegação
│   ├── services/            # API client
│   └── theme/               # Design System
└── package.json
```

---

## 🎯 Próximos Passos

### Agora
1. ✅ Teste todas as funcionalidades
2. ✅ Verifique o design em diferentes telas
3. ✅ Teste a navegação

### Depois
1. 📸 Adicione upload de fotos
2. 🌙 Implemente modo escuro
3. 🎮 Adicione gamificação
4. 🌐 Adicione internacionalização

---

## 📞 Comandos Úteis

```bash
# Iniciar app
npm start

# Limpar cache
npm start -- --clear

# Rodar no Android
npm run android

# Rodar no iOS
npm run ios

# Reinstalar dependências
rm -rf node_modules && npm install

# Ver logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

---

## ✨ Características do App

✅ **Design Moderno** - Gradientes, sombras, bordas arredondadas
✅ **Fácil de Usar** - Navegação intuitiva, feedback visual
✅ **Completo** - Todas as funcionalidades do backend
✅ **Rápido** - Otimizado para performance
✅ **Bonito** - Cores oceânicas, ícones modernos
✅ **Funcional** - Geolocalização, mapas, notificações

---

## 🎉 Pronto!

O app está **100% funcional** e pronto para ser testado!

**Dúvidas?** Consulte o README.md completo ou IMPLEMENTACAO.md

---

**🌊 PraiaAgora - Encontre a praia perfeita! 🏖️**
