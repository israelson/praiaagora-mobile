export const BEACH_ACTIVITIES = [
  { value: 'SURF', label: 'Surf', emoji: '🏄', description: 'Ondas boas para surf' },
  { value: 'KITESURF', label: 'Kitesurf', emoji: '🪁', description: 'Vento constante para kitesurf/windsurf' },
  { value: 'FAMILY', label: 'Família', emoji: '👨‍👩‍👧‍👦', description: 'Águas calmas, ideal para crianças' },
  { value: 'CALM_WATERS', label: 'Águas Calmas', emoji: '🛶', description: 'Stand-up paddle, caiaque' },
  { value: 'SNORKELING', label: 'Mergulho', emoji: '🤿', description: 'Boa visibilidade para snorkel' },
  { value: 'FISHING', label: 'Pesca', emoji: '🎣', description: 'Propícia para pesca esportiva' },
  { value: 'SPORTS', label: 'Esportes', emoji: '⚽', description: 'Espaço para vôlei, futebol de areia' },
  { value: 'TRAIL', label: 'Trilha', emoji: '🥾', description: 'Acesso por trilha (aventura)' },
  { value: 'URBAN', label: 'Urbana', emoji: '🏙️', description: 'Infraestrutura completa' },
  { value: 'WILD', label: 'Selvagem', emoji: '🌿', description: 'Praia preservada, natureza' },
] as const;

export type BeachActivity = typeof BEACH_ACTIVITIES[number]['value'];
