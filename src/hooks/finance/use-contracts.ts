import { contractsService } from '@/services/finance';
import type {
  ContractsQuery,
  CreateContractData,
  UpdateContractData,
} from '@/types/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CONTRACTS: ['contracts'],
  CONTRACT: (id: string) => ['contracts', id],
  SUPPLIER_HISTORY: (companyId?: string, companyName?: string) => [
    'contracts',
    'supplier-history',
    companyId,
    companyName,
  ],
} as const;

export function useContracts(params?: ContractsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRACTS, params],
    queryFn: () => contractsService.list(params),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONTRACT(id),
    queryFn: () => contractsService.get(id),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContractData) => contractsService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractData }) =>
      contractsService.update(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONTRACT(variables.id),
      });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
    },
  });
}

export function useGenerateContractEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractsService.generateEntries(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
    },
  });
}

export function useSupplierHistory(params: {
  companyId?: string;
  companyName?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIER_HISTORY(params.companyId, params.companyName),
    queryFn: () => contractsService.getSupplierHistory(params),
    enabled: !!(params.companyId || params.companyName),
  });
}
