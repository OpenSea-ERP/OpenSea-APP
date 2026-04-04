import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pdvService } from '@/services/sales';
import type {
  AddOrderItemRequest,
  CashierQueueQuery,
  CreatePdvOrderRequest,
  MyDraftsQuery,
  ReceivePaymentRequest,
} from '@/types/sales';

// =============================================================================
// Query Keys
// =============================================================================

export const PDV_KEYS = {
  all: ['pdv'] as const,
  order: (id: string) => ['pdv', 'order', id] as const,
  cashierQueue: (params?: CashierQueueQuery) =>
    ['pdv', 'cashier-queue', params] as const,
  myDrafts: (params?: MyDraftsQuery) => ['pdv', 'my-drafts', params] as const,
  byCode: (code: string) => ['pdv', 'by-code', code] as const,
} as const;

// =============================================================================
// Queries
// =============================================================================

export function usePdvOrder(id: string | null) {
  return useQuery({
    queryKey: PDV_KEYS.order(id ?? ''),
    queryFn: () => pdvService.getOrder(id!),
    enabled: !!id,
  });
}

export function useCashierQueue(params?: CashierQueueQuery) {
  return useQuery({
    queryKey: PDV_KEYS.cashierQueue(params),
    queryFn: () => pdvService.getCashierQueue(params),
    refetchInterval: 10_000,
  });
}

export function useMyDrafts(params?: MyDraftsQuery) {
  return useQuery({
    queryKey: PDV_KEYS.myDrafts(params),
    queryFn: () => pdvService.getMyDrafts(params),
  });
}

export function useOrderByCode(code: string) {
  return useQuery({
    queryKey: PDV_KEYS.byCode(code),
    queryFn: () => pdvService.getOrderByCode(code),
    enabled: !!code,
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useCreatePdvOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: CreatePdvOrderRequest) =>
      pdvService.createPdvOrder(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PDV_KEYS.all });
    },
  });
}

export function useAddOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: AddOrderItemRequest;
    }) => pdvService.addItem(orderId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: PDV_KEYS.order(variables.orderId),
      });
      toast.success('Item adicionado ao carrinho.');
    },
    onError: () => {
      toast.error('Erro ao adicionar item.');
    },
  });
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      pdvService.removeItem(orderId, itemId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: PDV_KEYS.order(variables.orderId),
      });
      toast.success('Item removido do carrinho.');
    },
    onError: () => {
      toast.error('Erro ao remover item.');
    },
  });
}

export function useUpdateOrderItemQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      quantity,
    }: {
      orderId: string;
      itemId: string;
      quantity: number;
    }) => pdvService.updateItemQuantity(orderId, itemId, quantity),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: PDV_KEYS.order(variables.orderId),
      });
    },
    onError: () => {
      toast.error('Erro ao atualizar quantidade.');
    },
  });
}

export function useSendToCashier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => pdvService.sendToCashier(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PDV_KEYS.all });
      toast.success('Pedido enviado para o caixa.');
    },
    onError: () => {
      toast.error('Erro ao enviar para o caixa.');
    },
  });
}

export function useClaimOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => pdvService.claimOrder(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PDV_KEYS.all });
    },
    onError: () => {
      toast.error('Erro ao reivindicar pedido.');
    },
  });
}

export function useReceivePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: ReceivePaymentRequest;
    }) => pdvService.receivePayment(orderId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PDV_KEYS.all });
      toast.success('Pagamento recebido com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao processar pagamento.');
    },
  });
}
