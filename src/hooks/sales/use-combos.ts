import { combosService } from '@/services/sales';
import type { CombosQuery, ComboType, CreateComboRequest } from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface CombosFilters {
  search?: string;
  type?: ComboType;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  COMBOS: ['combos'],
  COMBOS_INFINITE: (filters?: CombosFilters) => ['combos', 'infinite', filters],
  COMBO: (id: string) => ['combos', id],
} as const;

const PAGE_SIZE = 20;

export function useCombosInfinite(filters?: CombosFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.COMBOS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await combosService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        isActive: filters?.isActive || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      } as CombosQuery);
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

  const combos = result.data?.pages.flatMap(p => p.combos) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return { ...result, combos, total };
}

export function useCombo(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COMBO(id),
    queryFn: () => combosService.get(id),
    enabled: !!id,
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateComboRequest) => combosService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => combosService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}
