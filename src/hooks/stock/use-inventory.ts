import { inventoryService } from '@/services/stock';
import type {
  CreateInventoryCycleRequest,
  StartCycleRequest,
  CompleteCycleRequest,
  SubmitCountRequest,
  AdjustCountRequest,
  PaginatedQuery,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const INVENTORY_QUERY_KEYS = {
  CYCLES: ['inventory-cycles'],
  CYCLE: (id: string) => ['inventory-cycles', id],
  CYCLE_COUNTS: (cycleId: string) => ['inventory-cycles', cycleId, 'counts'],
  ACTIVE_CYCLES: ['inventory-cycles', 'active'],
  CYCLE_PROGRESS: (cycleId: string) => [
    'inventory-cycles',
    cycleId,
    'progress',
  ],
} as const;

// ============================================
// INVENTORY CYCLES
// ============================================

// GET /v1/inventory-cycles - Lista ciclos de inventário
export function useInventoryCycles(query?: PaginatedQuery) {
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEYS.CYCLES, query],
    queryFn: () => inventoryService.listCycles(query),
  });
}

// GET /v1/inventory-cycles/:id - Busca um ciclo específico
export function useInventoryCycle(id: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.CYCLE(id),
    queryFn: () => inventoryService.getCycle(id),
    enabled: !!id,
  });
}

// GET active cycles
export function useActiveInventoryCycles() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.ACTIVE_CYCLES,
    queryFn: () => inventoryService.getActiveCycles(),
  });
}

// GET /v1/inventory-cycles/:id/counts - Busca contagens de um ciclo
export function useInventoryCycleCounts(cycleId: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.CYCLE_COUNTS(cycleId),
    queryFn: () => inventoryService.getCycleCounts(cycleId),
    enabled: !!cycleId,
  });
}

// GET cycle progress
export function useInventoryCycleProgress(cycleId: string) {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEYS.CYCLE_PROGRESS(cycleId),
    queryFn: () => inventoryService.getCycleProgress(cycleId),
    enabled: !!cycleId,
    // Refresh during active counting
    refetchInterval: 60000,
  });
}

// POST /v1/inventory-cycles - Cria um novo ciclo
export function useCreateInventoryCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryCycleRequest) =>
      inventoryService.createCycle(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLES,
      });
    },
  });
}

// POST /v1/inventory-cycles/:id/start - Inicia um ciclo
export function useStartInventoryCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: StartCycleRequest }) =>
      inventoryService.startCycle(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLES,
      });
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLE(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.ACTIVE_CYCLES,
      });
    },
  });
}

// POST /v1/inventory-cycles/:id/complete - Completa um ciclo
export function useCompleteInventoryCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CompleteCycleRequest }) =>
      inventoryService.completeCycle(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLES,
      });
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLE(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.ACTIVE_CYCLES,
      });
      // Items may have been adjusted
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}

// ============================================
// INVENTORY COUNTS
// ============================================

// POST /v1/inventory-counts/:countId/count - Submete contagem
export function useSubmitInventoryCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      countId,
      data,
    }: {
      countId: string;
      data: SubmitCountRequest;
    }) => inventoryService.submitCount(countId, data),
    onSuccess: async () => {
      // Invalidate all cycle-related queries as we don't know which cycle this count belongs to
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLES,
      });
    },
  });
}

// POST /v1/inventory-counts/:countId/adjust - Ajusta contagem
export function useAdjustInventoryCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      countId,
      data,
    }: {
      countId: string;
      data: AdjustCountRequest;
    }) => inventoryService.adjustCount(countId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.CYCLES,
      });
      // Items may have been adjusted
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}
