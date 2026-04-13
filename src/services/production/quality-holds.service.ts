import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  QualityHoldResponse,
  QualityHoldsResponse,
} from '@/types/production';

export const qualityHoldsService = {
  async list(params?: {
    productionOrderId?: string;
    status?: string;
  }): Promise<QualityHoldsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.productionOrderId)
      searchParams.set('productionOrderId', params.productionOrderId);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return apiClient.get<QualityHoldsResponse>(
      `${API_ENDPOINTS.PRODUCTION.QUALITY_HOLDS.LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  async create(
    data: Record<string, unknown>,
  ): Promise<QualityHoldResponse> {
    return apiClient.post<QualityHoldResponse>(
      API_ENDPOINTS.PRODUCTION.QUALITY_HOLDS.CREATE,
      data,
    );
  },

  async release(
    id: string,
    data: Record<string, unknown>,
  ): Promise<QualityHoldResponse> {
    return apiClient.post<QualityHoldResponse>(
      API_ENDPOINTS.PRODUCTION.QUALITY_HOLDS.RELEASE(id),
      data,
    );
  },
};
