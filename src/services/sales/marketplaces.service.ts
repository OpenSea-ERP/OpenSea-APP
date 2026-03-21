import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateMarketplaceConnectionRequest,
  UpdateMarketplaceConnectionRequest,
  PublishMarketplaceListingRequest,
  MarketplaceConnectionsResponse,
  MarketplaceConnectionDTO,
  MarketplaceListingsResponse,
  MarketplaceListingDTO,
  MarketplaceOrdersResponse,
  MarketplaceOrderDTO,
  MarketplacePaymentsResponse,
  MarketplaceReconciliationDTO,
  MarketplaceOrderStatus,
} from '@/types/sales';

export const marketplacesService = {
  // === Connections ===
  async listConnections(params?: {
    page?: number;
    perPage?: number;
  }): Promise<MarketplaceConnectionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.MARKETPLACE_CONNECTIONS.LIST}?${query}`
      : API_ENDPOINTS.MARKETPLACE_CONNECTIONS.LIST;
    return apiClient.get<MarketplaceConnectionsResponse>(url);
  },

  async getConnection(
    id: string,
  ): Promise<{ connection: MarketplaceConnectionDTO }> {
    return apiClient.get<{ connection: MarketplaceConnectionDTO }>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.GET(id),
    );
  },

  async createConnection(
    data: CreateMarketplaceConnectionRequest,
  ): Promise<{ connection: MarketplaceConnectionDTO }> {
    return apiClient.post<{ connection: MarketplaceConnectionDTO }>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.CREATE,
      data,
    );
  },

  async updateConnection(
    id: string,
    data: UpdateMarketplaceConnectionRequest,
  ): Promise<{ connection: MarketplaceConnectionDTO }> {
    return apiClient.put<{ connection: MarketplaceConnectionDTO }>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.UPDATE(id),
      data,
    );
  },

  async deleteConnection(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.DELETE(id),
    );
  },

  async getReconciliation(
    connectionId: string,
  ): Promise<MarketplaceReconciliationDTO> {
    return apiClient.get<MarketplaceReconciliationDTO>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.RECONCILIATION(connectionId),
    );
  },

  // === Listings ===
  async listListings(
    connectionId: string,
    params?: { page?: number; perPage?: number },
  ): Promise<MarketplaceListingsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    const query = searchParams.toString();
    const base = API_ENDPOINTS.MARKETPLACE_CONNECTIONS.LISTINGS(connectionId);
    const url = query ? `${base}?${query}` : base;
    return apiClient.get<MarketplaceListingsResponse>(url);
  },

  async publishListing(
    connectionId: string,
    data: PublishMarketplaceListingRequest,
  ): Promise<{ listing: MarketplaceListingDTO }> {
    return apiClient.post<{ listing: MarketplaceListingDTO }>(
      API_ENDPOINTS.MARKETPLACE_CONNECTIONS.LISTINGS(connectionId),
      data,
    );
  },

  async deactivateListing(id: string): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      API_ENDPOINTS.MARKETPLACE_LISTINGS.DEACTIVATE(id),
    );
  },

  // === Orders ===
  async listOrders(params?: {
    page?: number;
    perPage?: number;
    connectionId?: string;
    status?: MarketplaceOrderStatus;
  }): Promise<MarketplaceOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.connectionId)
      searchParams.set('connectionId', params.connectionId);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.MARKETPLACE_ORDERS.LIST}?${query}`
      : API_ENDPOINTS.MARKETPLACE_ORDERS.LIST;
    return apiClient.get<MarketplaceOrdersResponse>(url);
  },

  async acknowledgeOrder(
    id: string,
  ): Promise<{ order: MarketplaceOrderDTO }> {
    return apiClient.patch<{ order: MarketplaceOrderDTO }>(
      API_ENDPOINTS.MARKETPLACE_ORDERS.ACKNOWLEDGE(id),
    );
  },

  // === Payments ===
  async listPayments(params?: {
    page?: number;
    perPage?: number;
    connectionId?: string;
  }): Promise<MarketplacePaymentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.connectionId)
      searchParams.set('connectionId', params.connectionId);
    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.MARKETPLACE_PAYMENTS.LIST}?${query}`
      : API_ENDPOINTS.MARKETPLACE_PAYMENTS.LIST;
    return apiClient.get<MarketplacePaymentsResponse>(url);
  },
};
