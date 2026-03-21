import { returnsService } from '@/services/sales';
import type { CreateReturnRequest } from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

const RETURN_KEYS = {
  all: ['returns'] as const,
  list: (filters?: Record<string, unknown>) =>
    ['returns', 'list', filters] as const,
} as const;

export function useReturnsInfinite(
  filters?: { search?: string; status?: string; orderId?: string },
  limit = 20,
) {
  return useInfiniteQuery({
    queryKey: RETURN_KEYS.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await returnsService.list({
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

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnRequest) => returnsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RETURN_KEYS.all });
    },
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => returnsService.approve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RETURN_KEYS.all });
    },
  });
}
