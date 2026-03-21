import { paymentConditionsService } from '@/services/sales';
import type {
  CreatePaymentConditionRequest,
  UpdatePaymentConditionRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const PC_KEYS = {
  all: ['payment-conditions'] as const,
  list: (filters?: Record<string, unknown>) =>
    ['payment-conditions', 'list', filters] as const,
} as const;

export function usePaymentConditionsInfinite(
  filters?: { search?: string; type?: string; isActive?: boolean },
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: PC_KEYS.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await paymentConditionsService.list({
        ...filters,
        page: pageParam,
        limit,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useCreatePaymentCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentConditionRequest) =>
      paymentConditionsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PC_KEYS.all });
    },
  });
}

export function useUpdatePaymentCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentConditionRequest;
    }) => paymentConditionsService.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PC_KEYS.all });
    },
  });
}

export function useDeletePaymentCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentConditionsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PC_KEYS.all });
    },
  });
}
