import { customersService } from '@/services/sales';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CUSTOMERS: ['customers'],
  CUSTOMER: (id: string) => ['customers', id],
} as const;

// GET /v1/customers - Lista todos os clientes
export function useCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS,
    queryFn: () => customersService.listCustomers(),
  });
}

// GET /v1/customers/:customerId - Busca um cliente específico
export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(customerId),
    queryFn: () => customersService.getCustomer(customerId),
    enabled: !!customerId,
  });
}

// POST /v1/customers - Cria um novo cliente
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      customersService.createCustomer(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
    },
  });
}

// PATCH /v1/customers/:customerId - Atualiza um cliente
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: UpdateCustomerRequest;
    }) => customersService.updateCustomer(customerId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CUSTOMER(variables.customerId),
      });
    },
  });
}

// DELETE /v1/customers/:customerId - Deleta um cliente
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) =>
      customersService.deleteCustomer(customerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS });
    },
  });
}
