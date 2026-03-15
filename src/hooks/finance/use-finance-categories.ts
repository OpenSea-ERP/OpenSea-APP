import { financeCategoriesService } from '@/services/finance';
import type {
  FinanceCategoriesQuery,
  CreateFinanceCategoryData,
  UpdateFinanceCategoryData,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  FINANCE_CATEGORIES: ['finance-categories'],
  FINANCE_CATEGORY: (id: string) => ['finance-categories', id],
} as const;

export function useFinanceCategories(params?: FinanceCategoriesQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCE_CATEGORIES, params],
    queryFn: () => financeCategoriesService.list(params),
  });
}

export function useFinanceCategory(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FINANCE_CATEGORY(id),
    queryFn: () => financeCategoriesService.get(id),
    enabled: !!id,
  });
}

export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinanceCategoryData) =>
      financeCategoriesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_CATEGORIES,
      });
    },
  });
}

export function useUpdateFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFinanceCategoryData;
    }) => financeCategoriesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_CATEGORIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_CATEGORY(variables.id),
      });
    },
  });
}

export function useDeleteFinanceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeCategoriesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_CATEGORIES,
      });
    },
  });
}
