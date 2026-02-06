# Integração de Balneabilidade - Mobile App

## 📱 Guia de Integração Completo

Este documento descreve como a funcionalidade de balneabilidade (qualidade da água) foi integrada no aplicativo mobile Praia Agora.

## ✅ Mudanças Implementadas

### 1. Componentes Atualizados

#### **BeachCard.tsx** 
- ✅ Interface `Beach` atualizada com tipos corretos:
  - `water_quality: 'PROPER' | 'IMPROPER' | null`
  - `water_quality_updated_at?: string | null`
  - `water_quality_confidence?: 'high' | 'medium' | 'low' | null`

- ✅ `getWaterQualityIcon()` atualizado para PROPER/IMPROPER
- ✅ Novo método `getWaterQualityBadge()` para exibir badge visual
- ✅ Badge aparece automaticamente na área de badges do card

#### **WaterQualityBadge.tsx** *(Novo Componente)*
```typescript
import WaterQualityBadge from '../components/beach/WaterQualityBadge';

<WaterQualityBadge 
  quality="PROPER" 
  showIcon={true}
  updatedAt="2026-02-02T00:00:00"
/>
```

**Props:**
- `quality`: 'PROPER' | 'IMPROPER' | null
- `showIcon?`: boolean (default: true)
- `size?`: 'small' | 'medium' | 'large' (default: 'small')
- `updatedAt?`: string | null (ISO date)

**Features:**
- Badge verde (✅) para águas próprias
- Badge vermelho (❌) para águas impróprias
- Badge cinza para sem dados
- Indicador de atualização (🟡) se dados > 3 dias

#### **ExploreScreen.tsx**
- ✅ Novo filtro "Qualidade da Água":
  - Todas (padrão)
  - ✅ Próprias
  - ❌ Impróprias
  - Com dados

- ✅ Filtro aplicado em conjunto com cidade e busca
- ✅ Contador atualizado dinamicamente

#### **BeachDetailScreen.tsx**
- ✅ Seção "Balneabilidade" completamente reformulada:
  - Badge grande com status (✅ Própria / ❌ Imprópria)
  - Mensagem explicativa (🏖️/⚠️/🚫)
  - Data de atualização dos dados
  - Fonte dos dados (IMA-SC + número de pontos)
  - Suporte retrocompatível com valores antigos

#### **HomeScreen.tsx**
- ✅ Mapeamento já está correto:
  ```typescript
  water_quality: rec.conditions?.water_quality
  ```

#### **api.ts** (Service)
- ✅ Novo método: `getBalneabilityReport()`
  ```typescript
  const report = await api.getBalneabilityReport();
  // { database: { total: 27, proper: 25, improper: 2 } }
  ```

---

## 🎨 Exemplos de Uso

### Exibir Badge em Qualquer Lugar

```tsx
import WaterQualityBadge from '../components/beach/WaterQualityBadge';

// Em um card de praia
<WaterQualityBadge 
  quality={beach.water_quality}
  updatedAt={beach.water_quality_updated_at}
/>

// Apenas ícone
<WaterQualityBadge 
  quality="PROPER"
  showIcon={true}
  size="large"
/>
```

### Filtrar Praias Próprias

```typescript
const properBeaches = beaches.filter(
  beach => beach.water_quality === 'PROPER'
);

const improperBeaches = beaches.filter(
  beach => beach.water_quality === 'IMPROPER'
);

const beachesWithData = beaches.filter(
  beach => beach.water_quality !== null
);
```

### Exibir Alertas

```tsx
{beach.water_quality === 'IMPROPER' && (
  <Alert severity="warning">
    <Text>⚠️ Água imprópria para banho</Text>
    <Text>Evite contato com o mar nesta praia.</Text>
  </Alert>
)}
```

### Obter Estatísticas

```typescript
const report = await api.getBalneabilityReport();

console.log(`
  Total de praias monitoradas: ${report.database.total_beaches_with_water_quality}
  Próprias: ${report.database.proper}
  Impróprias: ${report.database.improper}
`);

// Output:
// Total de praias monitoradas: 27
// Próprias: 25
// Impróprias: 2
```

---

## 📊 Estrutura de Dados

### Beach Object (Atualizado)

```typescript
interface Beach {
  id: number;
  name: string;
  city: string;
  latitude?: number;
  longitude?: number;
  
  // Campos de balneabilidade
  water_quality?: 'PROPER' | 'IMPROPER' | null;
  water_quality_updated_at?: string | null;
  water_quality_confidence?: 'high' | 'medium' | 'low' | null;
  
  // Outros campos
  status?: string;
  crowd_level?: string;
  temperature?: number;
  has_lifeguard?: boolean;
  icp?: number;
  icp_rating?: string;
  distance_formatted?: string;
}
```

### API Response (current_condition)

```json
{
  "id": "beach-uuid",
  "name": "Praia Daniela",
  "city": "Florianópolis",
  "current_condition": {
    "water_quality": "PROPER",
    "water_quality_points": 1,
    "water_quality_updated_at": "2026-02-02T00:00:00",
    "water_quality_confidence": "medium",
    "water_quality_note": null,
    "water_temperature": 28.0,
    "air_temperature": 27.9,
    "sources": ["OPENWEATHER", "IMA"]
  }
}
```

---

## 🧪 Testes Recomendados

### Checklist de Testes

- [ ] **HomeScreen**: Badges de balneabilidade aparecem nos cards
- [ ] **ExploreScreen**: 
  - [ ] Filtro "Próprias" mostra apenas praias PROPER
  - [ ] Filtro "Impróprias" mostra apenas praias IMPROPER
  - [ ] Filtro "Com dados" mostra praias com water_quality != null
  - [ ] Contador de praias atualiza corretamente
- [ ] **BeachDetailScreen**: 
  - [ ] Seção "Balneabilidade" aparece quando há dados
  - [ ] Data de atualização formatada corretamente
  - [ ] Fonte (IMA-SC) exibida com número de pontos
  - [ ] Badge verde/vermelho correto
- [ ] **WaterQualityBadge**:
  - [ ] Badge verde para PROPER
  - [ ] Badge vermelho para IMPROPER
  - [ ] Badge cinza para null
  - [ ] Indicador amarelo aparece se dados > 3 dias

### Dados de Teste

Use estas praias para testar:

**Próprias (PROPER):**
- Praia Daniela
- Praia Forte
- Praia Canasvieiras
- Praia Joaquina
- Praia Campeche

**Impróprias (IMPROPER):**
- Praia Ponta das Canas
- Praia Ingleses

**Sem dados (null):**
- Praia Jurerê Tradicional
- Praia Galheta
- Praias fora de Florianópolis

---

## 🔧 Troubleshooting

### Problema: Badge não aparece

**Causa**: Campo `water_quality` pode estar em `current_condition`

**Solução**: Verificar se está acessando corretamente:
```typescript
const quality = beach.current_condition?.water_quality || beach.water_quality;
```

### Problema: Filtro não funciona

**Causa**: Dados podem estar em estruturas diferentes

**Solução**: Verificar ambas as localizações:
```typescript
beach.current_condition?.water_quality === 'PROPER' || 
beach.water_quality === 'PROPER'
```

### Problema: Data de atualização não aparece

**Causa**: Campo opcional pode estar null

**Solução**: Usar conditional rendering:
```tsx
{updatedAt && (
  <Text>{format(new Date(updatedAt), 'dd/MM/yyyy')}</Text>
)}
```

### Problema: Cores não aparecem

**Causa**: Variantes do Badge podem estar incorretas

**Solução**: Usar variantes corretas:
- `'success'` para PROPER (verde)
- `'error'` para IMPROPER (vermelho)
- `'neutral'` para null (cinza)

---

## 📈 Estatísticas Atuais

**Cobertura**: 27 praias com dados de balneabilidade
- ✅ **25 praias próprias** (93%)
- ❌ **2 praias impróprias** (7%)

**Cidades**: Principalmente Florianópolis

**Fonte**: IMA-SC (Instituto do Meio Ambiente de Santa Catarina)

**Atualização**: Automática via backend

---

## 🚀 Próximos Passos

### Features Futuras Sugeridas

1. **Notificações Push**
   - Avisar quando praia favorita ficar imprópria
   - Alertar sobre mudanças de status

2. **Histórico**
   - Gráfico de qualidade ao longo do tempo
   - Tendências de melhora/piora

3. **Detalhes Técnicos**
   - Níveis de coliformes fecais
   - Explicação científica da classificação

4. **Share/Social**
   - Compartilhar status da praia
   - Alertar amigos sobre praias impróprias

5. **Filtros Avançados**
   - Combinar qualidade + distância + ICP
   - Salvar filtros favoritos

6. **Widget**
   - Widget iOS/Android com status das praias favoritas

---

## 📝 Notas Importantes

- **Responsabilidade**: Sistema informativo - usuários devem observar sinalização oficial local
- **Freshness**: Dados podem ter até 2-3 dias de defasagem
- **Cobertura**: Nem todas as praias têm monitoramento do IMA
- **Threshold**: Matching usa 65% de similaridade de nomes
- **Retrocompatibilidade**: Código suporta valores antigos (EXCELLENT, GOOD, REGULAR, BAD)

---

## 🔗 Links Úteis

- **Backend API Docs**: `/docs/API_DOCS.md`
- **Referência Rápida**: `/docs/BALNEABILITY_REFERENCE.md`
- **Exemplos Código**: `/docs/balneability_examples.tsx`
- **Endpoint Report**: `GET /api/v1/balneability/report`
- **Health Check**: `GET /health`

---

**Última Atualização**: 04 de Fevereiro de 2026  
**Versão Mobile**: 1.9+  
**Status**: ✅ Produção
