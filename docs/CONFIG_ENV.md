# Configuração de URL da API

Este projeto lê a `API_BASE_URL` na seguinte ordem de prioridade:

1. `app.json` → `expo.extra.API_BASE_URL`
2. `process.env.API_BASE_URL` (quando disponível no ambiente)
3. Fallback: `http://76.13.232.232:8000`

Como configurar em `app.json` (exemplo):

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://76.13.232.232:8000"
    }
  }
}
```

Se você usa `expo start --tunnel`, o `extra` será lido pelo app. Para builds e dev client, defina `extra` em `app.json` ou use variáveis de ambiente durante o processo de build.

Para desenvolvimento local usando variáveis de ambiente, você pode exportar antes de rodar:

```bash
export API_BASE_URL=http://76.13.232.232:8000
npx expo start
```

