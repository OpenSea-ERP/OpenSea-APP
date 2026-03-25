import { costCentersService } from '@/services/finance';
import type {
  CostCentersQuery,
  CreateCostCenterData,
  UpdateCostCenterData,
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

export interface CostCentersFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt' | 'monthlyBudget' | 'annualBudget';
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  COST_CENTERS: ['cost-centers'],
  COST_CENTERS_INFINITE: (filters?: CostCentersFilters) => [
    'cost-centers',
    'infinite',
    filters,
  ],
  COST_CENTER: (id: string) => ['cost-centers', id],
} as const;

const COST_CENTERS_PAGE_SIZE = 20;

export function useCostCenters(params?: CostCentersQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COST_CENTERS, params],
    queryFn: () => costCentersService.list(params),
  });
}

export function useCostCentersInfinite(filters?: CostCentersFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.COST_CENTERS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await costCentersService.list({
        page: pageParam,
        perPage: COST_CENTERS_PAGE_SIZE,
        search: filters?.search || undefined,
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

  const costCenters = result.data?.pages.flatMap(p => p.costCenters) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    costCenters,
    total,
  };
}

export function useCostCenter(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COST_CENTER(id),
    queryFn: () => costCentersService.get(id),
    enabled: !!id,
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCostCenterData) => costCentersService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COST_CENTERS,
      });
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCenterData }) =>
      costCentersService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COST_CENTERS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COST_CENTER(variables.id),
      });
    },
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => costCentersService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COST_CENTERS,
      });
    },
  });
}
