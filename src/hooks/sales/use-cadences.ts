import { cadencesService } from '@/services/sales';
import type {
  CadencesQuery,
  CreateCadenceRequest,
  UpdateCadenceRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface CadencesFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  CADENCES: ['cadences'],
  CADENCES_INFINITE: (filters?: CadencesFilters) => [
    'cadences',
    'infinite',
    filters,
  ],
  CADENCE: (id: string) => ['cadences', id],
} as const;

const PAGE_SIZE = 20;

export function useCadencesInfinite(filters?: CadencesFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.CADENCES_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return await cadencesService.list({
        page: pageParam,
        limit: PAGE_SIZE,
        search: filters?.search || undefined,
        isActive: filters?.isActive,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
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

  const cadences = result.data?.pages.flatMap(p => p.cadences) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    cadences,
    total,
  };
}

export function useCadence(cadenceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CADENCE(cadenceId),
    queryFn: () => cadencesService.get(cadenceId),
    enabled: !!cadenceId,
  });
}

export function useCreateCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCadenceRequest) => cadencesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });
}

export function useUpdateCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cadenceId,
      data,
    }: {
      cadenceId: string;
      data: UpdateCadenceRequest;
    }) => cadencesService.update(cadenceId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['cadences'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CADENCE(variables.cadenceId),
      });
    },
  });
}

export function useDeleteCadence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cadenceId: string) => cadencesService.delete(cadenceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });
}
