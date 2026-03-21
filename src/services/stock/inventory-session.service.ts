import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateInventorySessionRequest,
  ScanInventoryItemRequest,
  ResolveInventoryDivergenceRequest,
  InventorySessionResponse,
  InventorySessionsResponse,
  ScanInventoryItemResponse,
} from '@/types/stock';

export const inventorySessionService = {
  // POST /v1/stock/inventory-sessions — create session
  async create(
    data: CreateInventorySessionRequest
  ): Promise<InventorySessionResponse> {
    return apiClient.post<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.CREATE,
      data
    );
  },

  // GET /v1/stock/inventory-sessions — list sessions
  async list(params?: {
    status?: string;
  }): Promise<InventorySessionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    const qs = searchParams.toString();
    const url = `${API_ENDPOINTS.INVENTORY_SESSIONS.LIST}${qs ? `?${qs}` : ''}`;
    return apiClient.get<InventorySessionsResponse>(url);
  },

  // GET /v1/stock/inventory-sessions/:id — detail
  async get(id: string): Promise<InventorySessionResponse> {
    return apiClient.get<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.GET(id)
    );
  },

  // PATCH /v1/stock/inventory-sessions/:id/pause
  async pause(id: string): Promise<InventorySessionResponse> {
    return apiClient.patch<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.PAUSE(id)
    );
  },

  // PATCH /v1/stock/inventory-sessions/:id/resume
  async resume(id: string): Promise<InventorySessionResponse> {
    return apiClient.patch<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.RESUME(id)
    );
  },

  // PATCH /v1/stock/inventory-sessions/:id/complete
  async complete(id: string): Promise<InventorySessionResponse> {
    return apiClient.patch<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.COMPLETE(id)
    );
  },

  // PATCH /v1/stock/inventory-sessions/:id/cancel
  async cancel(id: string): Promise<InventorySessionResponse> {
    return apiClient.patch<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.CANCEL(id)
    );
  },

  // POST /v1/stock/inventory-sessions/:id/scan — scan item
  async scanItem(
    sessionId: string,
    data: ScanInventoryItemRequest
  ): Promise<ScanInventoryItemResponse> {
    return apiClient.post<ScanInventoryItemResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.SCAN(sessionId),
      data
    );
  },

  // PATCH /v1/stock/inventory-sessions/:id/items/:itemId/resolve — resolve divergence
  async resolveDivergence(
    sessionId: string,
    itemId: string,
    data: ResolveInventoryDivergenceRequest
  ): Promise<InventorySessionResponse> {
    return apiClient.patch<InventorySessionResponse>(
      API_ENDPOINTS.INVENTORY_SESSIONS.RESOLVE_ITEM(sessionId, itemId),
      data
    );
  },
};
