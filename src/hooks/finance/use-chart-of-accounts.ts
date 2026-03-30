import { chartOfAccountsService } from '@/services/finance';
import type {
  ChartOfAccountsQuery,
  CreateChartOfAccountData,
  UpdateChartOfAccountData,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ============================================================================
// FILTERS TYPE (for infinite scroll hook)
// ============================================================================

export interface ChartOfAccountsFilters {
  search?: string;
  type?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  CHART_OF_ACCOUNTS: ['chart-of-accounts'],
  CHART_OF_ACCOUNTS_INFINITE: (filters?: ChartOfAccountsFilters) => [
    'chart-of-accounts',
    'infinite',
    filters,
  ],
  CHART_OF_ACCOUNT: (id: string) => ['chart-of-accounts', id],
} as const;

const PAGE_SIZE = 50;

export function useChartOfAccounts(params?: ChartOfAccountsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CHART_OF_ACCOUNTS, params],
    queryFn: () => chartOfAccountsService.list(params),
  });
}

export function useChartOfAccountsInfinite(filters?: ChartOfAccountsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.CHART_OF_ACCOUNTS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await chartOfAccountsService.list({
        page: pageParam,
        perPage: PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type as ChartOfAccountsQuery['type'],
        isActive: filters?.isActive,
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

  const accounts = result.data?.pages.flatMap(p => p.chartOfAccounts) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    accounts,
    total,
  };
}

export function useChartOfAccount(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CHART_OF_ACCOUNT(id),
    queryFn: () => chartOfAccountsService.get(id),
    enabled: !!id,
  });
}

export function useCreateChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChartOfAccountData) =>
      chartOfAccountsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHART_OF_ACCOUNTS,
      });
    },
  });
}

export function useUpdateChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateChartOfAccountData;
    }) => chartOfAccountsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHART_OF_ACCOUNTS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHART_OF_ACCOUNT(variables.id),
      });
    },
  });
}

export function useDeleteChartOfAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chartOfAccountsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHART_OF_ACCOUNTS,
      });
    },
  });
}
