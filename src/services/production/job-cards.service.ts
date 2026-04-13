import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { JobCardResponse, JobCardsResponse } from '@/types/production';

export const jobCardsService = {
  async list(params?: {
    productionOrderId?: string;
    workstationId?: string;
  }): Promise<JobCardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.productionOrderId)
      searchParams.set('productionOrderId', params.productionOrderId);
    if (params?.workstationId)
      searchParams.set('workstationId', params.workstationId);
    const qs = searchParams.toString();
    return apiClient.get<JobCardsResponse>(
      `${API_ENDPOINTS.PRODUCTION.JOB_CARDS.LIST}${qs ? `?${qs}` : ''}`
    );
  },

  async create(data: Record<string, unknown>): Promise<JobCardResponse> {
    return apiClient.post<JobCardResponse>(
      API_ENDPOINTS.PRODUCTION.JOB_CARDS.CREATE,
      data
    );
  },

  async start(id: string): Promise<JobCardResponse> {
    return apiClient.post<JobCardResponse>(
      API_ENDPOINTS.PRODUCTION.JOB_CARDS.START(id)
    );
  },

  async complete(id: string): Promise<JobCardResponse> {
    return apiClient.post<JobCardResponse>(
      API_ENDPOINTS.PRODUCTION.JOB_CARDS.COMPLETE(id)
    );
  },

  async hold(id: string): Promise<JobCardResponse> {
    return apiClient.post<JobCardResponse>(
      API_ENDPOINTS.PRODUCTION.JOB_CARDS.HOLD(id)
    );
  },

  async report(
    id: string,
    data: Record<string, unknown>
  ): Promise<JobCardResponse> {
    return apiClient.post<JobCardResponse>(
      API_ENDPOINTS.PRODUCTION.JOB_CARDS.REPORT(id),
      data
    );
  },
};
