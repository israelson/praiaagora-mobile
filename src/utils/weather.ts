/**
 * Converte direção do vento em graus (0-360) para pontos cardeais
 * @param degrees Direção em graus (0-360)
 * @returns Ponto cardeal (N, NE, E, SE, S, SW, W, NW)
 */
export function getWindDirection(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return 'N';
  if (degrees >= 22.5 && degrees < 67.5) return 'NE';
  if (degrees >= 67.5 && degrees < 112.5) return 'E';
  if (degrees >= 112.5 && degrees < 157.5) return 'SE';
  if (degrees >= 157.5 && degrees < 202.5) return 'S';
  if (degrees >= 202.5 && degrees < 247.5) return 'SW';
  if (degrees >= 247.5 && degrees < 292.5) return 'W';
  if (degrees >= 292.5 && degrees < 337.5) return 'NW';
  return 'N';
}

/**
 * Converte direção do vento em graus para nome completo em português
 * @param degrees Direção em graus (0-360)
 * @returns Nome completo da direção
 */
export function getWindDirectionName(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return 'Norte';
  if (degrees >= 22.5 && degrees < 67.5) return 'Nordeste';
  if (degrees >= 67.5 && degrees < 112.5) return 'Leste';
  if (degrees >= 112.5 && degrees < 157.5) return 'Sudeste';
  if (degrees >= 157.5 && degrees < 202.5) return 'Sul';
  if (degrees >= 202.5 && degrees < 247.5) return 'Sudoeste';
  if (degrees >= 247.5 && degrees < 292.5) return 'Oeste';
  if (degrees >= 292.5 && degrees < 337.5) return 'Noroeste';
  return 'Norte';
}

/**
 * Formata informação completa do vento
 * @param speed Velocidade em km/h
 * @param direction Direção em graus
 * @returns String formatada (ex: "15.5 km/h NE")
 */
export function formatWindInfo(speed: number, direction: number): string {
  const dir = getWindDirection(direction);
  return `${speed.toFixed(1)} km/h ${dir}`;
}
