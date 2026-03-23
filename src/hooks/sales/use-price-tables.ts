import { priceTablesService } from '@/services/sales';
import type {
  CreatePriceTableRequest,
  PriceTablesQuery,
  UpdatePriceTableRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface PriceTablesFilters {
  search?: string;
  type?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  PRICE_TABLES: ['price-tables'],
  PRICE_TABLES_INFINITE: (filters?: PriceTablesFilters) => [
    'price-tables',
    'infinite',
    filters,
  ],
  PRICE_TABLE: (id: string) => ['price-tables', id],
  PRICE_TABLE_ITEMS: (id: string) => ['price-tables', id, 'items'],
} as const;

const PAGE_SIZE = 20;

export function usePriceTablesInfinite(filters?: PriceTablesFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.PRICE_TABLES_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await priceTablesService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        isActive: filters?.isActive || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      } as PriceTablesQuery);
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

  const priceTables = result.data?.pages.flatMap(p => p.priceTables) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return { ...result, priceTables, total };
}

export function usePriceTable(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRICE_TABLE(id),
    queryFn: () => priceTablesService.get(id),
    enabled: !!id,
  });
}

export function usePriceTableItems(tableId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRICE_TABLE_ITEMS(tableId),
    queryFn: () => priceTablesService.listItems(tableId, { limit: 100 }),
    enabled: !!tableId,
  });
}

export function useCreatePriceTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePriceTableRequest) =>
      priceTablesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['price-tables'] });
    },
  });
}

export function useUpdatePriceTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriceTableRequest }) =>
      priceTablesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['price-tables'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRICE_TABLE(variables.id),
      });
    },
  });
}

export function useDeletePriceTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => priceTablesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['price-tables'] });
    },
  });
}
