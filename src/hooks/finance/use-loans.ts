import { loansService } from '@/services/finance';
import type {
  LoansQuery,
  CreateLoanData,
  UpdateLoanData,
  PayLoanInstallmentData,
} from '@/types/finance';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  LOANS: ['loans'],
  LOAN: (id: string) => ['loans', id],
} as const;

export function useLoans(params?: LoansQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.LOANS, params],
    queryFn: () => loansService.list(params),
  });
}

export function useInfiniteLoans(
  params?: Omit<LoansQuery, 'page'>
) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.LOANS, 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      loansService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (meta.page < meta.totalPages) return meta.page + 1;
      return undefined;
    },
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LOAN(id),
    queryFn: () => loansService.get(id),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanData) => loansService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOANS });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoanData }) =>
      loansService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOANS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LOAN(variables.id),
      });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOANS });
    },
  });
}

export function usePayLoanInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      data,
    }: {
      loanId: string;
      data: PayLoanInstallmentData;
    }) => loansService.registerPayment(loanId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOANS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LOAN(variables.loanId),
      });
    },
  });
}
