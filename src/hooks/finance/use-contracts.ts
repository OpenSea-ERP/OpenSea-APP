import { contractsService } from '@/services/finance';
import type {
  ContractStatus,
  ContractsQuery,
  CreateContractData,
  UpdateContractData,
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

export interface ContractsFilters {
  search?: string;
  status?: string;
  sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'paymentAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  CONTRACTS: ['contracts'],
  CONTRACTS_INFINITE: (filters?: ContractsFilters) => [
    'contracts',
    'infinite',
    filters,
  ],
  CONTRACT: (id: string) => ['contracts', id],
  SUPPLIER_HISTORY: (companyId?: string, companyName?: string) => [
    'contracts',
    'supplier-history',
    companyId,
    companyName,
  ],
} as const;

export { QUERY_KEYS as contractsKeys };

// ============================================================================
// QUERIES
// ============================================================================

export function useContracts(params?: ContractsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRACTS, params],
    queryFn: () => contractsService.list(params),
  });
}

// Infinite scroll with server-side filters and sorting
const CONTRACTS_PAGE_SIZE = 20;

export function useContractsInfinite(filters?: ContractsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.CONTRACTS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await contractsService.list({
        page: pageParam,
        perPage: CONTRACTS_PAGE_SIZE,
        search: filters?.search || undefined,
        status: (filters?.status as ContractStatus) || undefined,
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
  const contracts = result.data?.pages.flatMap(p => p.contracts) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    contracts,
    total,
  };
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
