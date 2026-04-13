import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateProductionOrderRequest,
  ProductionOrderResponse,
  ProductionOrdersResponse,
  ProductionOrderStatus,
  ProductionOrderStatusCount,
  UpdateProductionOrderRequest,
} from '@/types/production';

export const productionOrdersService = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: ProductionOrderStatus;
    search?: string;
  }): Promise<ProductionOrdersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiClient.get<ProductionOrdersResponse>(
      `${API_ENDPOINTS.PRODUCTION.ORDERS.LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  async getById(id: string): Promise<ProductionOrderResponse> {
    return apiClient.get<ProductionOrderResponse>(
      API_ENDPOINTS.PRODUCTION.ORDERS.GET(id),
    );
  },

  async create(
    data: CreateProductionOrderRequest,
  ): Promise<ProductionOrderResponse> {
    return apiClient.post<ProductionOrderResponse>(
      API_ENDPOINTS.PRODUCTION.ORDERS.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: UpdateProductionOrderRequest,
  ): Promise<ProductionOrderResponse> {
    return apiClient.put<ProductionOrderResponse>(
      API_ENDPOINTS.PRODUCTION.ORDERS.UPDATE(id),
      data,
    );
  },

  async changeStatus(
    id: string,
    targetStatus: ProductionOrderStatus,
  ): Promise<ProductionOrderResponse> {
    return apiClient.post<ProductionOrderResponse>(
      API_ENDPOINTS.PRODUCTION.ORDERS.CHANGE_STATUS(id),
      { targetStatus },
    );
  },

  async cancel(id: string): Promise<ProductionOrderResponse> {
    return apiClient.post<ProductionOrderResponse>(
      API_ENDPOINTS.PRODUCTION.ORDERS.CANCEL(id),
    );
  },

  async countByStatus(): Promise<ProductionOrderStatusCount> {
    const response = await apiClient.get<{ counts: ProductionOrderStatusCount }>(
      API_ENDPOINTS.PRODUCTION.ORDERS.COUNT_BY_STATUS,
    );
    return response.counts;
  },
};
