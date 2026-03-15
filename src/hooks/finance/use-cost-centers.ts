import { costCentersService } from '@/services/finance';
import type {
  CostCentersQuery,
  CreateCostCenterData,
  UpdateCostCenterData,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  COST_CENTERS: ['cost-centers'],
  COST_CENTER: (id: string) => ['cost-centers', id],
} as const;

export function useCostCenters(params?: CostCentersQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COST_CENTERS, params],
    queryFn: () => costCentersService.list(params),
  });
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
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COST_CENTERS });
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCenterData }) =>
      costCentersService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COST_CENTERS });
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
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COST_CENTERS });
    },
  });
}
