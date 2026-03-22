import { financeRecurringService } from '@/services/finance';
import type {
  RecurringConfigsQuery,
  CreateRecurringConfigRequest,
  UpdateRecurringConfigRequest,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  RECURRING_CONFIGS: ['recurring-configs'],
  RECURRING_CONFIG: (id: string) => ['recurring-configs', id],
} as const;

export { QUERY_KEYS as recurringKeys };

// =============================================================================
// FILTERS TYPE
// =============================================================================

export interface RecurringFilters {
  search?: string;
  type?: string;
  status?: string;
  sortBy?: 'createdAt' | 'description' | 'expectedAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// INFINITE SCROLL HOOK
// =============================================================================

export function useRecurringInfinite(filters?: RecurringFilters) {
  const query = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.RECURRING_CONFIGS, 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params: RecurringConfigsQuery = {
        page: pageParam as number,
        limit: 20,
        search: filters?.search || undefined,
        type: (filters?.type as RecurringConfigsQuery['type']) || undefined,
        status:
          (filters?.status as RecurringConfigsQuery['status']) || undefined,
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
      };
      return financeRecurringService.list(params);
    },
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const configs = query.data?.pages.flatMap(page => page.configs) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return {
    configs,
    total,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

// =============================================================================
// STANDARD QUERY HOOKS
// =============================================================================

export function useRecurringConfigs(params?: RecurringConfigsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RECURRING_CONFIGS, params],
    queryFn: () => financeRecurringService.list(params),
  });
}

export function useRecurringConfig(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RECURRING_CONFIG(id),
    queryFn: () => financeRecurringService.get(id),
    enabled: !!id,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useCreateRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringConfigRequest) =>
      financeRecurringService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useUpdateRecurringConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRecurringConfigRequest;
    }) => financeRecurringService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIG(variables.id),
      });
    },
  });
}

export function usePauseRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.pause(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useResumeRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.resume(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}

export function useCancelRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeRecurringService.cancel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECURRING_CONFIGS,
      });
    },
  });
}
