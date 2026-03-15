import { customersService } from '@/services/sales';
import type {
  CreateCustomerRequest,
  Customer,
  CustomersResponse,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  FINANCE_CUSTOMERS: ['finance-customers'],
} as const;

/**
 * Hook for fetching customers in the finance context (receivable wizard).
 * Named differently from sales's useCustomers to avoid barrel export conflicts.
 */
export function useFinanceCustomers(params?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FINANCE_CUSTOMERS, params],
    queryFn: async (): Promise<{ customers: Customer[] }> => {
      const data: CustomersResponse = await customersService.listCustomers();
      let customers = data.customers ?? [];
      if (params?.search) {
        const term = params.search.toLowerCase();
        customers = customers.filter(c => c.name.toLowerCase().includes(term));
      }
      return { customers };
    },
  });
}

/**
 * Hook for creating a customer inline in the finance context.
 * Named differently from sales's useCreateCustomer to avoid barrel export conflicts.
 */
export function useCreateFinanceCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      customersService.createCustomer(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FINANCE_CUSTOMERS });
      // Also invalidate sales customers so sales pages stay in sync
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
