import { bankAccountsService } from '@/services/finance';
import type {
  BankAccountsQuery,
  CreateBankAccountData,
  UpdateBankAccountData,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  BANK_ACCOUNTS: ['bank-accounts'],
  BANK_ACCOUNT: (id: string) => ['bank-accounts', id],
} as const;

export function useBankAccounts(params?: BankAccountsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BANK_ACCOUNTS, params],
    queryFn: () => bankAccountsService.list(params),
  });
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
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANK_ACCOUNTS });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankAccountData }) =>
      bankAccountsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANK_ACCOUNTS });
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
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANK_ACCOUNTS });
    },
  });
}
