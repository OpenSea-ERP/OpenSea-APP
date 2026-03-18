// ============================================
// BINS API QUERIES & MUTATIONS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS, API_ENDPOINTS } from './keys';
import type {
  Bin,
  BinsResponse,
  BinResponse,
  BinOccupancyResponse,
  BinSearchResponse,
  BinSuggestionsResponse,
  BinDetailResponse,
  UpdateBinRequest,
} from '@/types/stock';

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar bins de uma zona
 */
export function useBins(zoneId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.zoneBins(zoneId),
    queryFn: async () => {
      const response = await apiClient.get<BinsResponse>(
        API_ENDPOINTS.bins.listByZone(zoneId)
      );
      return response.bins;
    },
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para listar todos os bins (sem filtro de zona)
 * Útil para selects globais de localização
 */
export function useAllBins(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.bins, 'all'],
    queryFn: async () => {
      const response = await apiClient.get<BinsResponse>(
        API_ENDPOINTS.bins.list
      );
      // Filtra apenas bins ativos e não bloqueados
      return response.bins.filter(bin => bin.isActive && !bin.isBlocked);
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obter ocupação dos bins (para mapa 2D)
 */
export function useBinOccupancy(zoneId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.zoneOccupancy(zoneId),
    queryFn: async () => {
      // Resposta da API usa formato diferente do frontend
      const response = await apiClient.get<{
        occupancyData: Array<{
          binId: string;
          address: string;
          aisle: number;
          shelf: number;
          position: string;
          capacity: number | null;
          currentOccupancy: number;
          isBlocked: boolean;
          itemCount: number;
        }>;
        stats: {
          totalBins: number;
          emptyBins: number;
          partialBins: number;
          fullBins: number;
          blockedBins: number;
        };
      }>(API_ENDPOINTS.bins.occupancyByZone(zoneId));

      // Mapear para o formato esperado pelo frontend
      const mappedResponse: BinOccupancyResponse = {
        bins: response.occupancyData.map(bin => ({
          id: bin.binId, // API retorna 'binId', frontend espera 'id'
          address: bin.address,
          aisle: bin.aisle,
          shelf: bin.shelf,
          position: bin.position,
          currentOccupancy: bin.currentOccupancy,
          capacity: bin.capacity ?? undefined,
          isBlocked: bin.isBlocked,
          itemCount: bin.itemCount,
        })),
        stats: {
          total: response.stats.totalBins,
          empty: response.stats.emptyBins,
          occupied: response.stats.partialBins + response.stats.fullBins, // partial + full = occupied
          blocked: response.stats.blockedBins,
          occupancyPercentage:
            response.stats.totalBins > 0
              ? ((response.stats.partialBins + response.stats.fullBins) /
                  response.stats.totalBins) *
                100
              : 0,
        },
      };

      return mappedResponse;
    },
    enabled: !!zoneId,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 120, // Refetch a cada 2 minutos
  });
}

/**
 * Hook para obter um bin por ID
 */
export function useBin(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.bin(id),
    queryFn: async () => {
      const response = await apiClient.get<BinResponse>(
        API_ENDPOINTS.bins.get(id)
      );
      return response.bin;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obter um bin por endereço
 */
export function useBinByAddress(address: string) {
  return useQuery({
    queryKey: QUERY_KEYS.binByAddress(address),
    queryFn: async () => {
      const response = await apiClient.get<BinResponse>(
        API_ENDPOINTS.bins.getByAddress(address)
      );
      return response.bin;
    },
    enabled: !!address && address.length >= 6,
  });
}

/**
 * Hook para obter detalhes completos de um bin (com itens)
 */
export function useBinDetail(binId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.binDetail(binId),
    queryFn: async () => {
      const response = await apiClient.get<BinDetailResponse>(
        `${API_ENDPOINTS.bins.get(binId)}/detail`
      );
      return response;
    },
    enabled: !!binId,
  });
}

/**
 * Hook para buscar bins por endereço parcial
 */
export function useBinSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.binSearch(query),
    queryFn: async () => {
      const response = await apiClient.get<BinSearchResponse>(
        API_ENDPOINTS.bins.search,
        {
          params: { q: query },
        }
      );
      return response;
    },
    enabled: !!query && query.length >= 3,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para sugestões de endereço (autocomplete)
 */
export function useBinSuggestions(partial: string) {
  return useQuery({
    queryKey: QUERY_KEYS.binSuggestions(partial),
    queryFn: async () => {
      const response = await apiClient.post<BinSuggestionsResponse>(
        API_ENDPOINTS.bins.suggest,
        { partial }
      );
      return response.suggestions;
    },
    enabled: !!partial && partial.length >= 3,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obter bins disponíveis (não cheios)
 */
export function useAvailableBins(zoneId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.bins, 'available', zoneId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (zoneId) params.zoneId = zoneId;

      const response = await apiClient.get<BinsResponse>(
        API_ENDPOINTS.bins.available,
        {
          params,
        }
      );
      return response.bins;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para atualizar um bin
 */
export function useUpdateBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      zoneId,
    }: {
      id: string;
      data: UpdateBinRequest;
      zoneId: string;
    }) => {
      const response = await apiClient.patch<BinResponse>(
        API_ENDPOINTS.bins.update(id),
        data
      );
      return response.bin;
    },
    onSuccess: (bin, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bin(variables.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.binByAddress(bin.address),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneBins(variables.zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneOccupancy(variables.zoneId),
      });
    },
  });
}

/**
 * Hook para bloquear um bin
 */
export function useBlockBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      zoneId,
    }: {
      id: string;
      reason?: string;
      zoneId: string;
    }) => {
      const response = await apiClient.post<BinResponse>(
        API_ENDPOINTS.bins.block(id),
        {
          reason,
        }
      );
      return response.bin;
    },
    onSuccess: (bin, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bin(variables.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneBins(variables.zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneOccupancy(variables.zoneId),
      });
    },
  });
}

/**
 * Hook para desbloquear um bin
 */
export function useUnblockBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, zoneId }: { id: string; zoneId: string }) => {
      const response = await apiClient.post<BinResponse>(
        API_ENDPOINTS.bins.unblock(id)
      );
      return response.bin;
    },
    onSuccess: (bin, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bin(variables.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneBins(variables.zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneOccupancy(variables.zoneId),
      });
    },
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Valida se um endereço existe
 */
export async function validateAddress(address: string): Promise<boolean> {
  try {
    await apiClient.get(API_ENDPOINTS.address.validate(address));
    return true;
  } catch {
    return false;
  }
}

/**
 * Parseia um endereço no backend
 */
export async function parseAddressRemote(address: string) {
  return apiClient.get<{
    warehouseCode: string;
    zoneCode: string;
    aisle: number;
    shelf: number;
    bin: string;
    isValid: boolean;
  }>(API_ENDPOINTS.address.parse(address));
}
