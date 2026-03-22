import { loansService } from '@/services/finance';
import type {
  LoansQuery,
  LoanStatus,
  LoanType,
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

// ============================================================================
// FILTERS TYPE (for infinite scroll hooks)
// ============================================================================

export interface LoansFilters {
  search?: string;
  status?: LoanStatus;
  type?: LoanType;
  sortBy?:
    | 'createdAt'
    | 'totalAmount'
    | 'institution'
    | 'status'
    | 'name'
    | 'principalAmount'
    | 'outstandingBalance';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  LOANS: ['loans'],
  LOANS_INFINITE: (filters?: LoansFilters) => ['loans', 'infinite', filters],
  LOAN: (id: string) => ['loans', id],
} as const;

export { QUERY_KEYS as loanKeys };

// ============================================================================
// QUERIES
// ============================================================================

export function useLoans(params?: LoansQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.LOANS, params],
    queryFn: () => loansService.list(params),
  });
}

// Infinite scroll with server-side filters and sorting
const LOANS_PAGE_SIZE = 20;

export function useLoansInfinite(filters?: LoansFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.LOANS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await loansService.list({
        page: pageParam,
        perPage: LOANS_PAGE_SIZE,
        search: filters?.search || undefined,
        status: filters?.status || undefined,
        type: filters?.type || undefined,
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
  const loans = result.data?.pages.flatMap(p => p.loans) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    loans,
    total,
  };
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
