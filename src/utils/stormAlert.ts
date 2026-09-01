import { Ionicons } from '@expo/vector-icons';

export type StormAlertLevel = 'yellow' | 'orange' | 'red';

export interface StormAlert {
  level: StormAlertLevel;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** true when this came from the backend's official INMET/Defesa Civil integration */
  isOfficial?: boolean;
}

interface ConditionsForAlert {
  weather_description?: string | null;
  wind_speed?: number | null;
  wave_height?: number | null;
}

interface OfficialAlertInput {
  alert_level?: StormAlertLevel | null;
  alert_message?: string | null;
}

const STORM_KEYWORDS = [
  'tempestade',
  'trovoada',
  'temporal',
  'vendaval',
  'ventania',
  'chuva forte',
  'chuva intensa',
  'granizo',
];

const LEVEL_RANK: Record<StormAlertLevel, number> = { yellow: 1, orange: 2, red: 3 };

const LEVEL_TITLE: Record<StormAlertLevel, string> = {
  yellow: 'Atenção',
  orange: 'Perigo',
  red: 'Perigo Extremo',
};

const LEVEL_ICON: Record<StormAlertLevel, keyof typeof Ionicons.glyphMap> = {
  yellow: 'alert-circle',
  orange: 'warning',
  red: 'thunderstorm',
};

/**
 * Alerta oficial da Defesa Civil/INMET, já processado e casado por município
 * pelo backend. Deve ter prioridade sobre a heurística `getStormAlert` abaixo
 * sempre que presente.
 */
export function buildOfficialStormAlert(conditions?: OfficialAlertInput | null): StormAlert | null {
  const level = conditions?.alert_level;
  if (!level) return null;

  return {
    level,
    title: LEVEL_TITLE[level],
    message:
      conditions?.alert_message ||
      'Alerta oficial ativo emitido pela Defesa Civil/INMET para esta região.',
    icon: LEVEL_ICON[level],
    isOfficial: true,
  };
}

/**
 * Heurística própria do Beachly baseada nos dados meteorológicos já
 * retornados pela API (OpenWeather) — não é um alerta oficial da Defesa
 * Civil/INMET. Serve como aviso rápido apenas quando não há alerta oficial
 * disponível para o município (ver `buildOfficialStormAlert`).
 */
export function getStormAlert(conditions?: ConditionsForAlert | null): StormAlert | null {
  if (!conditions) return null;

  const description = (conditions.weather_description || '').toLowerCase();
  const hasStormKeyword = STORM_KEYWORDS.some((keyword) => description.includes(keyword));
  const windSpeed = conditions.wind_speed ?? 0;
  const waveHeight = conditions.wave_height ?? 0;

  let level: StormAlertLevel | null = null;
  const reasons: string[] = [];

  const raise = (candidate: StormAlertLevel) => {
    if (!level || LEVEL_RANK[candidate] > LEVEL_RANK[level]) {
      level = candidate;
    }
  };

  if (hasStormKeyword) {
    raise('red');
    reasons.push('tempestade em curso');
  }

  if (windSpeed >= 60) {
    raise('red');
    reasons.push(`vento costeiro extremo (${windSpeed.toFixed(0)} km/h)`);
  } else if (windSpeed >= 40) {
    raise('orange');
    reasons.push(`vento costeiro forte (${windSpeed.toFixed(0)} km/h)`);
  } else if (windSpeed >= 30) {
    raise('yellow');
    reasons.push(`vento forte (${windSpeed.toFixed(0)} km/h)`);
  }

  if (waveHeight >= 3) {
    raise('orange');
    reasons.push(`mar muito agitado (ondas de ${waveHeight.toFixed(1)}m)`);
  } else if (waveHeight >= 2) {
    raise('yellow');
    reasons.push(`mar agitado (ondas de ${waveHeight.toFixed(1)}m)`);
  }

  if (!level) return null;

  return {
    level,
    title: LEVEL_TITLE[level],
    message: `Condições adversas: ${reasons.join(', ')}. Redobre a atenção antes de entrar na água.`,
    icon: LEVEL_ICON[level],
  };
}
