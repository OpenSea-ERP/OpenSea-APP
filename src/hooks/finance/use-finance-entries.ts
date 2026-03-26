import { financeEntriesService } from '@/services/finance';
import type {
  FinanceEntriesQuery,
  FinanceEntryType,
  CreateFinanceEntryData,
  UpdateFinanceEntryData,
  RegisterPaymentData,
  ParseBoletoRequest,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ============================================================================
// FILTERS TYPE (for infinite scroll hooks)
// ============================================================================

export interface FinanceEntriesFilters {
  type?: FinanceEntryType;
  search?: string;
  status?: string;
  categoryId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sortBy?:
    | 'createdAt'
    | 'dueDate'
    | 'expectedAmount'
    | 'description'
    | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  FINANCE_ENTRIES: ['finance-entries'],
  FINANCE_ENTRIES_INFINITE: (filters?: FinanceEntriesFilters) => [
    'finance-entries',
    'infinite',
    filters,
  ],
  FINANCE_ENTRY: (id: string) => ['finance-entries', id],
} as const;

export { QUERY_KEYS as financeEntryKeys };

// ============================================================================
// QUERIES
// ============================================================================

export function useFinanceEntries(params?: FinanceEntriesQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCE_ENTRIES, params],
    queryFn: () => financeEntriesService.list(params),
  });
}

// Infinite scroll with server-side filters and sorting
const ENTRIES_PAGE_SIZE = 20;

export function useFinanceEntriesInfinite(
  filters?: FinanceEntriesFilters,
  options?: { enabled?: boolean }
) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.FINANCE_ENTRIES_INFINITE(filters),
    enabled: options?.enabled ?? true,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await financeEntriesService.list({
        page: pageParam,
        perPage: ENTRIES_PAGE_SIZE,
        type: filters?.type,
        search: filters?.search || undefined,
        status: (filters?.status as FinanceEntriesQuery['status']) || undefined,
        categoryId: filters?.categoryId || undefined,
        dueDateFrom: filters?.dueDateFrom || undefined,
        dueDateTo: filters?.dueDateTo || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  // Flatten pages into single array
  const entries = result.data?.pages.flatMap(p => p.entries) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    entries,
    total,
  };
}

export function useFinanceEntry(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FINANCE_ENTRY(id),
    queryFn: () => financeEntriesService.get(id),
    enabled: !!id,
  });
}

export function useCreateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinanceEntryData) =>
      financeEntriesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useUpdateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinanceEntryData }) =>
      financeEntriesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(variables.id),
      });
    },
  });
}

export function useDeleteFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeEntriesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useCancelFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeEntriesService.cancel(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(id),
      });
    },
  });
}

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string;
      data: RegisterPaymentData;
    }) => financeEntriesService.registerPayment(entryId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(variables.entryId),
      });
    },
  });
}

export function useCheckOverdue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => financeEntriesService.checkOverdue(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useParseBoleto() {
  return useMutation({
    mutationFn: (data: ParseBoletoRequest) =>
      financeEntriesService.parseBoleto(data),
  });
}
