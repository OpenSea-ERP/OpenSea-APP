import { bankAccountsService } from '@/services/finance';
import type {
  BankAccountsQuery,
  BankAccountStatus,
  BankAccountType,
  CreateBankAccountData,
  UpdateBankAccountData,
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

export interface BankAccountsFilters {
  search?: string;
  status?: BankAccountStatus;
  accountType?: BankAccountType;
  sortBy?: 'name' | 'bankName' | 'currentBalance' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  BANK_ACCOUNTS: ['bank-accounts'],
  BANK_ACCOUNTS_INFINITE: (filters?: BankAccountsFilters) => [
    'bank-accounts',
    'infinite',
    filters,
  ],
  BANK_ACCOUNT: (id: string) => ['bank-accounts', id],
} as const;

export function useBankAccounts(params?: BankAccountsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BANK_ACCOUNTS, params],
    queryFn: () => bankAccountsService.list(params),
  });
}

// ============================================================================
// INFINITE SCROLL HOOK
// ============================================================================

const BANK_ACCOUNTS_PAGE_SIZE = 20;

export function useBankAccountsInfinite(filters?: BankAccountsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.BANK_ACCOUNTS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await bankAccountsService.list({
        page: pageParam,
        perPage: BANK_ACCOUNTS_PAGE_SIZE,
        search: filters?.search || undefined,
        status: filters?.status || undefined,
        accountType: filters?.accountType || undefined,
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
  const bankAccounts = result.data?.pages.flatMap(p => p.bankAccounts) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    bankAccounts,
    total,
  };
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BANK_ACCOUNT(id),
    queryFn: () => bankAccountsService.get(id),
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankAccountData) =>
      bankAccountsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANK_ACCOUNTS,
      });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankAccountData }) =>
      bankAccountsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANK_ACCOUNTS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANK_ACCOUNT(variables.id),
      });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankAccountsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANK_ACCOUNTS,
      });
    },
  });
}
