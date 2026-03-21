import { ordersService } from '@/services/sales';
import type {
  CancelOrderRequest,
  ChangeOrderStageRequest,
  CreateOrderRequest,
  OrdersQuery,
  UpdateOrderRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const ORDER_KEYS = {
  all: ['orders'] as const,
  list: (filters?: OrdersQuery) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
} as const;

export type OrdersFilters = Omit<OrdersQuery, 'page' | 'limit'>;

export function useOrdersInfinite(filters?: OrdersFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: ORDER_KEYS.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await ordersService.listOrders({
        ...filters,
        page: pageParam,
        limit,
      });
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersService.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersService.createOrder(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrderRequest;
    }) => ordersService.updateOrder(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      await queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.confirmOrder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CancelOrderRequest;
    }) => ordersService.cancelOrder(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useChangeOrderStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ChangeOrderStageRequest;
    }) => ordersService.changeOrderStage(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useConvertQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.convertQuote(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}
