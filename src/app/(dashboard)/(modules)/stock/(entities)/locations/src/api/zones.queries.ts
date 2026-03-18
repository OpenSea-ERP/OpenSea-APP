// ============================================
// ZONES API QUERIES & MUTATIONS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS, API_ENDPOINTS } from './keys';
import type {
  Zone,
  ZonesResponse,
  ZoneResponse,
  CreateZoneRequest,
  UpdateZoneRequest,
  ConfigureZoneStructureRequest,
  ConfigureZoneStructureResponse,
  StructurePreviewResponse,
  ReconfigurationPreviewResponse,
  ZoneItemStatsResponse,
  ZoneLayout,
  LayoutResponse,
  SaveLayoutRequest,
} from '@/types/stock';

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar zonas de um armazém
 */
export function useZones(warehouseId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.warehouseZones(warehouseId),
    queryFn: async () => {
      const response = await apiClient.get<ZonesResponse>(
        API_ENDPOINTS.zones.listByWarehouse(warehouseId)
      );
      return response.zones;
    },
    enabled: !!warehouseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para listar todas as zonas (de todos os armazéns)
 * Útil para o gerador de etiquetas
 */
export function useAllZones() {
  return useQuery({
    queryKey: QUERY_KEYS.zones,
    queryFn: async () => {
      const response = await apiClient.get<ZonesResponse>(
        API_ENDPOINTS.zones.list
      );
      return response.zones;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obter uma zona específica
 */
export function useZone(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.zone(id),
    queryFn: async () => {
      const response = await apiClient.get<ZoneResponse>(
        API_ENDPOINTS.zones.get(id)
      );
      return response.zone;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obter o layout de uma zona
 */
export function useZoneLayout(zoneId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.zoneLayout(zoneId),
    queryFn: async () => {
      const response = await apiClient.get<LayoutResponse>(
        API_ENDPOINTS.zones.layout(zoneId)
      );
      return response.layout;
    },
    enabled: !!zoneId,
  });
}

/**
 * Hook para preview da estrutura (sem criar)
 */
export function useStructurePreview(
  zoneId: string,
  structure: ConfigureZoneStructureRequest | null
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.zoneStructure(zoneId), structure],
    queryFn: async () => {
      const response = await apiClient.post<StructurePreviewResponse>(
        API_ENDPOINTS.zones.structurePreview(zoneId),
        structure
      );
      return response;
    },
    enabled: !!zoneId && !!structure,
  });
}

/**
 * Hook para preview de reconfiguracao (diff)
 */
export function useReconfigurationPreview(
  zoneId: string,
  structure: ConfigureZoneStructureRequest['structure'] | null
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.zoneReconfigPreview(zoneId), structure],
    queryFn: async () => {
      const response = await apiClient.post<ReconfigurationPreviewResponse>(
        API_ENDPOINTS.zones.reconfigPreview(zoneId),
        { structure }
      );
      return response;
    },
    enabled: !!zoneId && !!structure,
  });
}

/**
 * Hook para obter estatisticas de itens de uma zona
 */
export function useZoneItemStats(zoneId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.zoneItemStats(zoneId),
    queryFn: async () => {
      return apiClient.get<ZoneItemStatsResponse>(
        API_ENDPOINTS.zones.itemStats(zoneId)
      );
    },
    enabled: !!zoneId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para criar uma zona
 */
export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      warehouseId,
      data,
    }: {
      warehouseId: string;
      data: CreateZoneRequest;
    }) => {
      const response = await apiClient.post<ZoneResponse>(
        API_ENDPOINTS.zones.create,
        {
          ...data,
          warehouseId,
        }
      );
      return response.zone;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.warehouseZones(variables.warehouseId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    },
  });
}

/**
 * Hook para atualizar uma zona
 */
export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateZoneRequest;
    }) => {
      const response = await apiClient.patch<ZoneResponse>(
        API_ENDPOINTS.zones.update(id),
        data
      );
      return response.zone;
    },
    onSuccess: (zone, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zone(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.warehouseZones(zone.warehouseId),
      });
    },
  });
}

/**
 * Hook para deletar uma zona
 */
export function useDeleteZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      warehouseId,
    }: {
      id: string;
      warehouseId: string;
    }) => {
      await apiClient.delete(API_ENDPOINTS.zones.delete(id));
      return { id, warehouseId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.warehouseZones(variables.warehouseId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    },
  });
}

/**
 * Hook para configurar a estrutura de uma zona
 */
export function useConfigureZoneStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      zoneId,
      structure,
      forceRemoveOccupiedBins,
    }: {
      zoneId: string;
      structure: ConfigureZoneStructureRequest;
      forceRemoveOccupiedBins?: boolean;
    }) => {
      const response = await apiClient.post<ConfigureZoneStructureResponse>(
        API_ENDPOINTS.zones.structure(zoneId),
        { ...structure, forceRemoveOccupiedBins }
      );
      return response;
    },
    onSuccess: result => {
      const zone = result.zone;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.zone(zone.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.warehouseZones(zone.warehouseId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.zoneBins(zone.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneOccupancy(zone.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneItemStats(zone.id),
      });
    },
  });
}

/**
 * Hook para salvar o layout de uma zona
 */
export function useSaveZoneLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      zoneId,
      layout,
    }: {
      zoneId: string;
      layout: ZoneLayout;
    }) => {
      const response = await apiClient.put<LayoutResponse>(
        API_ENDPOINTS.zones.layout(zoneId),
        { layout } as SaveLayoutRequest
      );
      return response.layout;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneLayout(variables.zoneId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zone(variables.zoneId),
      });
    },
  });
}

/**
 * Hook para resetar o layout para o automático
 */
export function useResetZoneLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneId: string) => {
      const response = await apiClient.post<LayoutResponse>(
        API_ENDPOINTS.zones.layoutReset(zoneId)
      );
      return response.layout;
    },
    onSuccess: (_, zoneId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.zoneLayout(zoneId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.zone(zoneId) });
    },
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se um código de zona já existe em um armazém
 */
export async function checkZoneCodeExists(
  warehouseId: string,
  code: string
): Promise<boolean> {
  try {
    const response = await apiClient.get<ZonesResponse>(
      API_ENDPOINTS.zones.listByWarehouse(warehouseId)
    );
    return response.zones.some(
      z => z.code.toLowerCase() === code.toLowerCase()
    );
  } catch {
    return false;
  }
}
