// ============================================
// WAREHOUSES API QUERIES & MUTATIONS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS, API_ENDPOINTS } from './keys';
import type {
  Warehouse,
  WarehousesResponse,
  WarehouseResponse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '@/types/stock';

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar todos os armazéns
 */
export function useWarehouses() {
  return useQuery({
    queryKey: QUERY_KEYS.warehouses,
    queryFn: async () => {
      const response = await apiClient.get<WarehousesResponse>(
        API_ENDPOINTS.warehouses.list
      );
      return response.warehouses;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obter um armazém específico
 */
export function useWarehouse(id: string) {
  // Valida se o ID é um UUID válido (não "undefined" ou string vazia)
  const isValidId = !!id && id !== 'undefined' && id.length === 36;

  return useQuery({
    queryKey: QUERY_KEYS.warehouse(id),
    queryFn: async () => {
      const response = await apiClient.get<WarehouseResponse>(
        API_ENDPOINTS.warehouses.get(id)
      );
      return response.warehouse;
    },
    enabled: isValidId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para criar um armazém
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWarehouseRequest) => {
      const response = await apiClient.post<WarehouseResponse>(
        API_ENDPOINTS.warehouses.create,
        data
      );
      return response.warehouse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    },
  });
}

/**
 * Hook para atualizar um armazém
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWarehouseRequest;
    }) => {
      const response = await apiClient.patch<WarehouseResponse>(
        API_ENDPOINTS.warehouses.update(id),
        data
      );
      return response.warehouse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.warehouse(variables.id),
      });
    },
  });
}

/**
 * Hook para deletar um armazém
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.warehouses.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    },
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se um código de armazém já existe
 */
export async function checkWarehouseCodeExists(code: string): Promise<boolean> {
  try {
    const response = await apiClient.get<WarehousesResponse>(
      API_ENDPOINTS.warehouses.list
    );
    return response.warehouses.some(
      w => w.code.toLowerCase() === code.toLowerCase()
    );
  } catch {
    return false;
  }
}

/**
 * Prefetch de armazéns para melhorar performance
 */
export function usePrefetchWarehouses() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.warehouses,
      queryFn: async () => {
        const response = await apiClient.get<WarehousesResponse>(
          API_ENDPOINTS.warehouses.list
        );
        return response.warehouses;
      },
      staleTime: 1000 * 60 * 5,
    });
  };
}
