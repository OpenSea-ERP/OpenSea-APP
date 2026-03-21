import { financeEntriesService } from '@/services/finance';
import type {
  FinanceEntriesQuery,
  CreateFinanceEntryData,
  UpdateFinanceEntryData,
  RegisterPaymentData,
  ParseBoletoRequest,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  FINANCE_ENTRIES: ['finance-entries'],
  FINANCE_ENTRY: (id: string) => ['finance-entries', id],
} as const;

export { QUERY_KEYS as financeEntryKeys };

export function useFinanceEntries(params?: FinanceEntriesQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCE_ENTRIES, params],
    queryFn: () => financeEntriesService.list(params),
  });
}

export function useInfiniteFinanceEntries(
  params?: Omit<FinanceEntriesQuery, 'page'>
) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.FINANCE_ENTRIES, 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      financeEntriesService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      const limit = meta.limit ?? 20;
      const totalPages = meta.totalPages ?? Math.ceil(meta.total / limit);
      return meta.page < totalPages ? meta.page + 1 : undefined;
    },
  });
}

export function useFinanceEntry(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FINANCE_ENTRY(id),
    queryFn: () => financeEntriesService.get(id),
    enabled: !!id,
  });
}

export function useCreateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinanceEntryData) =>
      financeEntriesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useUpdateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinanceEntryData }) =>
      financeEntriesService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(variables.id),
      });
    },
  });
}

export function useDeleteFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeEntriesService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useCancelFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeEntriesService.cancel(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(id),
      });
    },
  });
}

export function useRegisterPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string;
      data: RegisterPaymentData;
    }) => financeEntriesService.registerPayment(entryId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRY(variables.entryId),
      });
    },
  });
}

export function useCheckOverdue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => financeEntriesService.checkOverdue(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_ENTRIES,
      });
    },
  });
}

export function useParseBoleto() {
  return useMutation({
    mutationFn: (data: ParseBoletoRequest) =>
      financeEntriesService.parseBoleto(data),
  });
}
