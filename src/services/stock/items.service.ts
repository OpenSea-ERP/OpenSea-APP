import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BatchEntryRequest,
  BatchTransferItemsRequest,
  BatchTransferResponse,
  ItemEntryResponse,
  ItemExitResponse,
  ItemLabelDataResponse,
  ItemMovementsQuery,
  ItemMovementsResponse,
  ItemResponse,
  ItemsQuery,
  ItemsResponse,
  ItemTransferResponse,
  LocationHistoryResponse,
  PaginatedItemsResponse,
  RegisterItemEntryExtendedRequest,
  RegisterItemEntryRequest,
  RegisterItemExitRequest,
  TransferItemRequest,
} from '@/types/stock';

export const itemsService = {
  // GET /v1/items/by-variant/:variantId (preferred) or /v1/items (all items)
  async listItems(variantId?: string): Promise<ItemsResponse> {
    const url = variantId
      ? API_ENDPOINTS.ITEMS.BY_VARIANT(variantId)
      : API_ENDPOINTS.ITEMS.LIST;
    return apiClient.get<ItemsResponse>(url);
  },

  // GET /v1/items/by-product/:productId
  async listItemsByProduct(productId: string): Promise<ItemsResponse> {
    return apiClient.get<ItemsResponse>(
      API_ENDPOINTS.ITEMS.BY_PRODUCT(productId)
    );
  },

  // GET /v1/items with pagination and filters
  async list(query?: ItemsQuery): Promise<PaginatedItemsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.variantId) params.append('variantId', query.variantId);
    if (query?.locationId) params.append('locationId', query.locationId);
    if (query?.warehouseId) params.append('warehouseId', query.warehouseId);
    if (query?.status) params.append('status', query.status);
    if (query?.volumeId) params.append('volumeId', query.volumeId);
    if (query?.search) params.append('search', query.search);
    if (query?.manufacturerId) params.append('manufacturerId', query.manufacturerId);
    if (query?.zoneId) params.append('zoneId', query.zoneId);
    if (query?.hideEmpty) params.append('hideEmpty', 'true');
    if (query?.updatedFrom) params.append('updatedFrom', query.updatedFrom);
    if (query?.updatedTo) params.append('updatedTo', query.updatedTo);

    const url = params.toString()
      ? `${API_ENDPOINTS.ITEMS.LIST}?${params.toString()}`
      : API_ENDPOINTS.ITEMS.LIST;

    return apiClient.get<PaginatedItemsResponse>(url);
  },

  // POST /v1/items/batch - Bulk entry
  async createBatch(data: {
    variantId: string;
    locationId?: string;
    quantity: number;
    lotNumber?: string;
    expirationDate?: string;
    movementType: string;
    movementReason?: string;
  }): Promise<{ items: ItemResponse['item'][]; movements: unknown[] }> {
    return apiClient.post(`${API_ENDPOINTS.ITEMS.LIST}/batch`, data);
  },

  // GET /v1/items/:itemId
  async getItem(itemId: string): Promise<ItemResponse> {
    return apiClient.get<ItemResponse>(API_ENDPOINTS.ITEMS.GET(itemId));
  },

  // POST /v1/items/entry
  async registerEntry(
    data: RegisterItemEntryRequest
  ): Promise<ItemEntryResponse> {
    return apiClient.post<ItemEntryResponse>(API_ENDPOINTS.ITEMS.ENTRY, data);
  },

  // POST /v1/items/exit
  async registerExit(data: RegisterItemExitRequest): Promise<ItemExitResponse> {
    return apiClient.post<ItemExitResponse>(API_ENDPOINTS.ITEMS.EXIT, data);
  },

  // POST /v1/items/transfer
  async transferItem(data: TransferItemRequest): Promise<ItemTransferResponse> {
    return apiClient.post<ItemTransferResponse>(
      API_ENDPOINTS.ITEMS.TRANSFER,
      data
    );
  },

  // POST /v1/items/batch-transfer
  async batchTransfer(
    data: BatchTransferItemsRequest
  ): Promise<BatchTransferResponse> {
    return apiClient.post<BatchTransferResponse>(
      API_ENDPOINTS.ITEMS.BATCH_TRANSFER,
      data
    );
  },

  // GET /v1/items/:itemId/location-history
  async getLocationHistory(itemId: string): Promise<LocationHistoryResponse> {
    return apiClient.get<LocationHistoryResponse>(
      API_ENDPOINTS.ITEMS.LOCATION_HISTORY(itemId)
    );
  },

  // POST /v1/items/label-data - Get label presenter data for multiple items
  async getLabelData(itemIds: string[]): Promise<ItemLabelDataResponse> {
    return apiClient.post<ItemLabelDataResponse>(
      API_ENDPOINTS.ITEMS.LABEL_DATA,
      { itemIds }
    );
  },

  // DELETE /v1/items/:itemId
  async deleteItem(itemId: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.ITEMS.DELETE(itemId));
  },
};

export const itemMovementsService = {
  // GET /v1/item-movements
  async listMovements(
    query?: ItemMovementsQuery
  ): Promise<ItemMovementsResponse> {
    return apiClient.get<ItemMovementsResponse>(
      API_ENDPOINTS.ITEM_MOVEMENTS.LIST,
      { params: query as Record<string, string> }
    );
  },
};
