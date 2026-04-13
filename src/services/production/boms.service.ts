import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BomItemResponse,
  BomItemsResponse,
  BomResponse,
  BomsResponse,
  CreateBomItemRequest,
  CreateBomRequest,
  UpdateBomItemRequest,
  UpdateBomRequest,
} from '@/types/production';

export const bomsService = {
  // BOMs
  async list(productId?: string): Promise<BomsResponse> {
    const params = productId ? `?productId=${productId}` : '';
    return apiClient.get<BomsResponse>(
      `${API_ENDPOINTS.PRODUCTION.BOMS.LIST}${params}`
    );
  },

  async getById(id: string): Promise<BomResponse> {
    return apiClient.get<BomResponse>(API_ENDPOINTS.PRODUCTION.BOMS.GET(id));
  },

  async create(data: CreateBomRequest): Promise<BomResponse> {
    return apiClient.post<BomResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.CREATE,
      data
    );
  },

  async update(id: string, data: UpdateBomRequest): Promise<BomResponse> {
    return apiClient.put<BomResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PRODUCTION.BOMS.DELETE(id));
  },

  async approve(id: string): Promise<BomResponse> {
    return apiClient.post<BomResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.APPROVE(id)
    );
  },

  // BOM Items
  async listItems(bomId: string): Promise<BomItemsResponse> {
    return apiClient.get<BomItemsResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.ITEMS.LIST(bomId)
    );
  },

  async createItem(
    bomId: string,
    data: CreateBomItemRequest
  ): Promise<BomItemResponse> {
    return apiClient.post<BomItemResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.ITEMS.CREATE(bomId),
      data
    );
  },

  async updateItem(
    bomId: string,
    id: string,
    data: UpdateBomItemRequest
  ): Promise<BomItemResponse> {
    return apiClient.put<BomItemResponse>(
      API_ENDPOINTS.PRODUCTION.BOMS.ITEMS.UPDATE(bomId, id),
      data
    );
  },

  async deleteItem(bomId: string, id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.BOMS.ITEMS.DELETE(bomId, id)
    );
  },
};
