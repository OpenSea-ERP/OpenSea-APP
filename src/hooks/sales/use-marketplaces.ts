import { marketplacesService } from '@/services/sales/marketplaces.service';
import type {
  CreateMarketplaceConnectionRequest,
  UpdateMarketplaceConnectionRequest,
  PublishMarketplaceListingRequest,
  MarketplaceOrderStatus,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const PAGE_SIZE = 20;

const QUERY_KEYS = {
  CONNECTIONS: ['marketplace-connections'],
  CONNECTIONS_INFINITE: ['marketplace-connections', 'infinite'],
  CONNECTION: (id: string) => ['marketplace-connections', id],
  LISTINGS: (connectionId: string) => ['marketplace-listings', connectionId],
  LISTINGS_INFINITE: (connectionId: string) => [
    'marketplace-listings',
    connectionId,
    'infinite',
  ],
  ORDERS: (connectionId?: string) => ['marketplace-orders', connectionId],
  ORDERS_INFINITE: (connectionId?: string, status?: string) => [
    'marketplace-orders',
    'infinite',
    connectionId,
    status,
  ],
  PAYMENTS: (connectionId?: string) => ['marketplace-payments', connectionId],
  PAYMENTS_INFINITE: (connectionId?: string) => [
    'marketplace-payments',
    'infinite',
    connectionId,
  ],
  RECONCILIATION: (connectionId: string) => [
    'marketplace-reconciliation',
    connectionId,
  ],
} as const;

// === Connections ===
export function useMarketplaceConnectionsInfinite() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.CONNECTIONS_INFINITE,
    queryFn: async ({ pageParam = 1 }) => {
      return await marketplacesService.listConnections({
        page: pageParam,
        perPage: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useMarketplaceConnection(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONNECTION(id),
    queryFn: async () => {
      const response = await marketplacesService.getConnection(id);
      return response.connection;
    },
    enabled: !!id,
  });
}

export function useCreateMarketplaceConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMarketplaceConnectionRequest) =>
      marketplacesService.createConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTIONS,
      });
    },
  });
}

export function useUpdateMarketplaceConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMarketplaceConnectionRequest;
    }) => marketplacesService.updateConnection(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTIONS,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTION(variables.id),
      });
    },
  });
}

export function useDeleteMarketplaceConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketplacesService.deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONNECTIONS,
      });
    },
  });
}

// === Listings ===
export function useMarketplaceListingsInfinite(connectionId: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.LISTINGS_INFINITE(connectionId),
    queryFn: async ({ pageParam = 1 }) => {
      return await marketplacesService.listListings(connectionId, {
        page: pageParam,
        perPage: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!connectionId,
  });
}

export function usePublishMarketplaceListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      data,
    }: {
      connectionId: string;
      data: PublishMarketplaceListingRequest;
    }) => marketplacesService.publishListing(connectionId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LISTINGS(variables.connectionId),
      });
    },
  });
}

export function useDeactivateMarketplaceListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketplacesService.deactivateListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['marketplace-listings'],
      });
    },
  });
}

// === Orders ===
export function useMarketplaceOrdersInfinite(
  connectionId?: string,
  status?: MarketplaceOrderStatus,
) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.ORDERS_INFINITE(connectionId, status),
    queryFn: async ({ pageParam = 1 }) => {
      return await marketplacesService.listOrders({
        page: pageParam,
        perPage: PAGE_SIZE,
        connectionId,
        status,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useAcknowledgeMarketplaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketplacesService.acknowledgeOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['marketplace-orders'],
      });
    },
  });
}

// === Payments ===
export function useMarketplacePaymentsInfinite(connectionId?: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.PAYMENTS_INFINITE(connectionId),
    queryFn: async ({ pageParam = 1 }) => {
      return await marketplacesService.listPayments({
        page: pageParam,
        perPage: PAGE_SIZE,
        connectionId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

// === Reconciliation ===
export function useMarketplaceReconciliation(connectionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RECONCILIATION(connectionId),
    queryFn: () => marketplacesService.getReconciliation(connectionId),
    enabled: !!connectionId,
  });
}
