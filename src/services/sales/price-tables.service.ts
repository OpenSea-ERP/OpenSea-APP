import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreatePriceTableRequest,
  PaginatedPriceTablesResponse,
  PriceTableItemsResponse,
  PriceTableResponse,
  PriceTablesQuery,
  ResolvePriceRequest,
  ResolvePriceResult,
  UpdatePriceTableRequest,
  UpsertPriceTableItemRequest,
} from '@/types/sales';

export const priceTablesService = {
  async list(query?: PriceTablesQuery): Promise<PaginatedPriceTablesResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.type) params.append('type', query.type);
    if (query?.isActive) params.append('isActive', query.isActive);

    const url = params.toString()
      ? `${API_ENDPOINTS.PRICE_TABLES.LIST}?${params.toString()}`
      : API_ENDPOINTS.PRICE_TABLES.LIST;

    return apiClient.get<PaginatedPriceTablesResponse>(url);
  },

  async get(id: string): Promise<PriceTableResponse> {
    return apiClient.get<PriceTableResponse>(
      API_ENDPOINTS.PRICE_TABLES.GET(id)
    );
  },

  async create(data: CreatePriceTableRequest): Promise<PriceTableResponse> {
    return apiClient.post<PriceTableResponse>(
      API_ENDPOINTS.PRICE_TABLES.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdatePriceTableRequest
  ): Promise<PriceTableResponse> {
    return apiClient.put<PriceTableResponse>(
      API_ENDPOINTS.PRICE_TABLES.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PRICE_TABLES.DELETE(id));
  },

  async listItems(
    tableId: string,
    query?: PriceTablesQuery
  ): Promise<PriceTableItemsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const url = params.toString()
      ? `${API_ENDPOINTS.PRICE_TABLES.ITEMS.LIST(tableId)}?${params.toString()}`
      : API_ENDPOINTS.PRICE_TABLES.ITEMS.LIST(tableId);

    return apiClient.get<PriceTableItemsResponse>(url);
  },

  async upsertItems(
    tableId: string,
    data: UpsertPriceTableItemRequest
  ): Promise<{ items: unknown[] }> {
    return apiClient.put<{ items: unknown[] }>(
      API_ENDPOINTS.PRICE_TABLES.ITEMS.UPSERT(tableId),
      data
    );
  },

  async resolvePrice(
    data: ResolvePriceRequest
  ): Promise<{ result: ResolvePriceResult }> {
    return apiClient.post<{ result: ResolvePriceResult }>(
      API_ENDPOINTS.PRICE_TABLES.RESOLVE,
      data
    );
  },
};
