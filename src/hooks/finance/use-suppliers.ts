import { suppliersService } from '@/services/stock';
import type {
  CreateSupplierRequest,
  Supplier,
  SuppliersResponse,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  FINANCE_SUPPLIERS: ['finance-suppliers'],
} as const;

/**
 * Hook for fetching suppliers in the finance context (payable wizard).
 * Named differently from stock's useSuppliers to avoid barrel export conflicts.
 */
export function useFinanceSuppliers(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCE_SUPPLIERS, params],
    queryFn: async (): Promise<{ suppliers: Supplier[] }> => {
      const data: SuppliersResponse = await suppliersService.listSuppliers();
      let suppliers = data.suppliers ?? [];
      if (params?.search) {
        const term = params.search.toLowerCase();
        suppliers = suppliers.filter(s => s.name.toLowerCase().includes(term));
      }
      return { suppliers };
    },
  });
}

/**
 * Hook for creating a supplier inline in the finance context.
 * Named differently from stock's useCreateSupplier to avoid barrel export conflicts.
 */
export function useCreateFinanceSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) =>
      suppliersService.createSupplier(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FINANCE_SUPPLIERS,
      });
      // Also invalidate stock suppliers so stock pages stay in sync
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
