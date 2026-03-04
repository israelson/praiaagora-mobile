import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import api from '../services/api';

interface UseAutoCheckinOptions {
  enabled?: boolean;
  checkInterval?: number; // milliseconds
  maxDistance?: number; // meters
}

interface AutoCheckinState {
  isChecking: boolean;
  lastCheckin: Date | null;
  error: string | null;
}

/**
 * Hook para check-in automático baseado em proximidade GPS.
 * 
 * Detecta quando usuário está próximo de uma praia (< 500m) e
 * registra check-in automaticamente para estatísticas de lotação.
 * 
 * @param beaches - Lista de praias próximas para monitorar
 * @param options - Configurações do hook
 * @returns Estado do check-in automático
 * 
 * @example
 * ```tsx
 * const { isChecking, lastCheckin } = useAutoCheckin(nearbyBeaches, {
 *   enabled: true,
 *   checkInterval: 5 * 60 * 1000, // 5 minutos
 *   maxDistance: 500 // 500 metros
 * });
 * ```
 */
export function useAutoCheckin(
  beaches: any[],
  options: UseAutoCheckinOptions = {}
) {
  const {
    enabled = true,
    checkInterval = 5 * 60 * 1000, // 5 minutos
    maxDistance = 500 // 500 metros
  } = options;

  const [state, setState] = useState<AutoCheckinState>({
    isChecking: false,
    lastCheckin: null,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkedBeachesRef = useRef<Set<string>>(new Set());

  /**
   * Calcula distância entre dois pontos GPS (Haversine formula)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  };

  /**
   * Verifica proximidade e faz check-in se necessário
   */
  const checkAndCheckin = async () => {
    if (!enabled || beaches.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const { latitude, longitude } = location.coords;

      // Verificar cada praia
      for (const beach of beaches) {
        // Pular se já fez check-in nesta sessão
        if (checkedBeachesRef.current.has(beach.id)) {
          continue;
        }

        // Calcular distância
        const distance = calculateDistance(
          latitude,
          longitude,
          beach.latitude,
          beach.longitude
        );

        // Se estiver próximo (< maxDistance)
        if (distance <= maxDistance) {
          try {
            // Fazer check-in via ApiService helper
            const data = await api.createAutoCheckin(beach.id, latitude, longitude);

            // Sucesso: marca como checked
            checkedBeachesRef.current.add(beach.id);
            setState(prev => ({
              ...prev,
              lastCheckin: new Date(),
              error: null
            }));

            console.log(`✅ Check-in automático: ${beach.name} (${distance.toFixed(0)}m)`);
          } catch (error: any) {
            // Erro 400 = muito longe, ignorar silenciosamente
            if (error.response?.status !== 400) {
              console.warn(`Erro ao fazer check-in em ${beach.name}:`, error.message);
            }
          }
        }
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao verificar localização'
      }));
      console.error('Erro no check-in automático:', error);
    } finally {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Verificar imediatamente
    checkAndCheckin();

    // Configurar intervalo
    intervalRef.current = setInterval(checkAndCheckin, checkInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, beaches, checkInterval, maxDistance]);

  // Limpar check-ins quando lista de praias mudar significativamente
  const beachIdsKey = beaches.map(b => b.id).join(',');
  useEffect(() => {
    checkedBeachesRef.current.clear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beachIdsKey]);

  return state;
}
