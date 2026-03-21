import { inventorySessionService } from '@/services/stock/inventory-session.service';
import { scanSuccess, scanError } from '@/lib/scan-feedback';
import type {
  CreateInventorySessionRequest,
  ScanInventoryItemRequest,
  ResolveInventoryDivergenceRequest,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const INVENTORY_SESSION_KEYS = {
  ALL: ['inventory-sessions'] as const,
  LIST: (params?: { status?: string }) =>
    ['inventory-sessions', 'list', params] as const,
  DETAIL: (id: string) => ['inventory-sessions', 'detail', id] as const,
} as const;

// GET /v1/stock/inventory-sessions — list sessions
export function useInventorySessions(params?: { status?: string }) {
  return useQuery({
    queryKey: INVENTORY_SESSION_KEYS.LIST(params),
    queryFn: () => inventorySessionService.list(params),
  });
}

// GET /v1/stock/inventory-sessions/:id — detail
export function useInventorySession(id: string) {
  return useQuery({
    queryKey: INVENTORY_SESSION_KEYS.DETAIL(id),
    queryFn: () => inventorySessionService.get(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll while session is active
  });
}

// POST /v1/stock/inventory-sessions — create
export function useCreateInventorySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventorySessionRequest) =>
      inventorySessionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.ALL,
      });
    },
  });
}

// POST /v1/stock/inventory-sessions/:id/scan — scan item
export function useScanInventoryItem(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScanInventoryItemRequest) =>
      inventorySessionService.scanItem(sessionId, data),
    onSuccess: () => {
      scanSuccess();
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.DETAIL(sessionId),
      });
    },
    onError: () => {
      scanError();
    },
  });
}

// PATCH /v1/stock/inventory-sessions/:id/items/:itemId/resolve — resolve divergence
export function useResolveDivergence(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: ResolveInventoryDivergenceRequest;
    }) => inventorySessionService.resolveDivergence(sessionId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.DETAIL(sessionId),
      });
    },
  });
}

// PATCH /v1/stock/inventory-sessions/:id/pause
export function usePauseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventorySessionService.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.ALL,
      });
    },
  });
}

// PATCH /v1/stock/inventory-sessions/:id/resume
export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventorySessionService.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.ALL,
      });
    },
  });
}

// PATCH /v1/stock/inventory-sessions/:id/complete
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventorySessionService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.ALL,
      });
    },
  });
}

// PATCH /v1/stock/inventory-sessions/:id/cancel
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventorySessionService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_SESSION_KEYS.ALL,
      });
    },
  });
}
