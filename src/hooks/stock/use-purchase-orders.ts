import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  purchaseOrdersService,
  type PurchaseOrdersQuery,
} from '@/services/stock/purchase-orders.service';
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderStatus,
} from '@/types/stock';

const QUERY_KEYS = {
  PURCHASE_ORDERS: ['purchase-orders'],
  PURCHASE_ORDERS_LIST: (query?: PurchaseOrdersQuery) => [
    'purchase-orders',
    'list',
    query,
  ],
  PURCHASE_ORDER: (id: string) => ['purchase-orders', id],
} as const;

// GET /v1/purchase-orders - List purchase orders with pagination
export function usePurchaseOrders(query?: PurchaseOrdersQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDERS_LIST(query),
    queryFn: () => purchaseOrdersService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

// GET /v1/purchase-orders (legacy - no pagination)
export function usePurchaseOrdersAll() {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDERS,
    queryFn: () => purchaseOrdersService.listAll(),
  });
}

// GET /v1/purchase-orders/:id - Get single purchase order
export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDER(id),
    queryFn: () => purchaseOrdersService.get(id),
    enabled: !!id,
  });
}

// POST /v1/purchase-orders - Create purchase order
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) =>
      purchaseOrdersService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
    },
  });
}

// PATCH /v1/purchase-orders/:id/status - Update status
export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      purchaseOrdersService.updateStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PURCHASE_ORDER(variables.id),
      });
    },
  });
}

// POST /v1/purchase-orders/:id/cancel - Cancel purchase order
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.cancel(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PURCHASE_ORDER(id),
      });
    },
  });
}

// POST /v1/purchase-orders/:id/receive - Receive items
export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: string;
      items: Array<{ itemId: string; receivedQuantity: number }>;
    }) => purchaseOrdersService.receive(id, items),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PURCHASE_ORDER(variables.id),
      });
      // Also invalidate items since receiving creates new items
      await queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
