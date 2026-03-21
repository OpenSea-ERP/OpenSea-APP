import { consortiaService } from '@/services/finance';
import type {
  ConsortiaQuery,
  CreateConsortiumData,
  UpdateConsortiumData,
  PayConsortiumInstallmentData,
  MarkContemplatedData,
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

export interface ConsortiaFilters {
  search?: string;
  status?: string;
  isContemplated?: string;
  sortBy?: 'createdAt' | 'monthlyPayment' | 'administrator' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  CONSORTIA: ['consortia'],
  CONSORTIA_INFINITE: (filters?: ConsortiaFilters) => [
    'consortia',
    'infinite',
    filters,
  ],
  CONSORTIUM: (id: string) => ['consortia', id],
} as const;

export { QUERY_KEYS as consortiaKeys };

// ============================================================================
// QUERIES
// ============================================================================

export function useConsortia(params?: ConsortiaQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONSORTIA, params],
    queryFn: () => consortiaService.list(params),
  });
}

// Infinite scroll with server-side filters and sorting
const CONSORTIA_PAGE_SIZE = 20;

export function useConsortiaInfinite(filters?: ConsortiaFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.CONSORTIA_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await consortiaService.list({
        page: pageParam,
        perPage: CONSORTIA_PAGE_SIZE,
        search: filters?.search || undefined,
        status: (filters?.status as ConsortiaQuery['status']) || undefined,
        isContemplated:
          filters?.isContemplated === 'YES'
            ? true
            : filters?.isContemplated === 'NO'
              ? false
              : undefined,
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

  // Flatten pages into single array
  const consortia = result.data?.pages.flatMap(p => p.consortia) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    consortia,
    total,
  };
}

export function useConsortium(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONSORTIUM(id),
    queryFn: () => consortiaService.get(id),
    enabled: !!id,
  });
}

export function useCreateConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConsortiumData) => consortiaService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
    },
  });
}

export function useUpdateConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConsortiumData }) =>
      consortiaService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.id),
      });
    },
  });
}

export function useDeleteConsortium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consortiaService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
    },
  });
}

export function usePayConsortiumInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      consortiumId,
      data,
    }: {
      consortiumId: string;
      data: PayConsortiumInstallmentData;
    }) => consortiaService.registerPayment(consortiumId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.consortiumId),
      });
    },
  });
}

export function useMarkContemplated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkContemplatedData }) =>
      consortiaService.markContemplated(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONSORTIA });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONSORTIUM(variables.id),
      });
    },
  });
}
