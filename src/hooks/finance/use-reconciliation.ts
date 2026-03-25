import { reconciliationService } from '@/services/finance';
import type {
  ReconciliationStatus,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ============================================================================
// FILTERS TYPE
// ============================================================================

export interface ReconciliationFilters {
  bankAccountId?: string;
  status?: ReconciliationStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  RECONCILIATIONS: ['reconciliations'],
  RECONCILIATIONS_INFINITE: (filters?: ReconciliationFilters) => [
    'reconciliations',
    'infinite',
    filters,
  ],
  RECONCILIATION: (id: string) => ['reconciliations', id],
  SUGGESTIONS: (reconciliationId: string, itemId: string) => [
    'reconciliations',
    reconciliationId,
    'suggestions',
    itemId,
  ],
} as const;

// ============================================================================
// LIST (infinite scroll)
// ============================================================================

const PAGE_SIZE = 20;

export function useReconciliationsInfinite(filters?: ReconciliationFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.RECONCILIATIONS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await reconciliationService.list({
        page: pageParam,
        perPage: PAGE_SIZE,
        bankAccountId: filters?.bankAccountId || undefined,
        status: filters?.status || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  const reconciliations =
    result.data?.pages.flatMap(p => p.reconciliations) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    reconciliations,
    total,
  };
}

// ============================================================================
// DETAIL
// ============================================================================

export function useReconciliation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RECONCILIATION(id),
    queryFn: () => reconciliationService.get(id),
    enabled: !!id,
  });
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

export function useReconciliationSuggestions(
  reconciliationId: string,
  itemId: string
) {
  return useQuery({
    queryKey: QUERY_KEYS.SUGGESTIONS(reconciliationId, itemId),
    queryFn: () =>
      reconciliationService.getSuggestions(reconciliationId, itemId),
    enabled: !!reconciliationId && !!itemId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useImportOfx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankAccountId,
      file,
    }: {
      bankAccountId: string;
      file: File;
    }) => reconciliationService.import(bankAccountId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}

export function useMatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reconciliationId,
      itemId,
      entryId,
    }: {
      reconciliationId: string;
      itemId: string;
      entryId: string;
    }) => reconciliationService.matchItem(reconciliationId, itemId, entryId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATION(variables.reconciliationId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}

export function useIgnoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reconciliationId,
      itemId,
      reason,
    }: {
      reconciliationId: string;
      itemId: string;
      reason?: string;
    }) => reconciliationService.ignoreItem(reconciliationId, itemId, reason),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATION(variables.reconciliationId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}

export function useCreateEntryFromItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reconciliationId,
      itemId,
    }: {
      reconciliationId: string;
      itemId: string;
    }) => reconciliationService.createEntryFromItem(reconciliationId, itemId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATION(variables.reconciliationId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}

export function useCompleteReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reconciliationService.complete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}

export function useCancelReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reconciliationService.cancel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECONCILIATIONS,
      });
    },
  });
}
