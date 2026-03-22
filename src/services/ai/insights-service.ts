import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { AiInsight } from '@/types/ai';

export interface InsightsResponse {
  insights: AiInsight[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const aiInsightsService = {
  async list(params?: {
    status?: string;
    type?: string;
    priority?: string;
    module?: string;
    page?: number;
    limit?: number;
  }): Promise<InsightsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.module) query.append('module', params.module);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.AI.INSIGHTS.LIST}?${queryString}`
      : API_ENDPOINTS.AI.INSIGHTS.LIST;

    return apiClient.get<InsightsResponse>(url);
  },

  async markViewed(insightId: string): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(
      API_ENDPOINTS.AI.INSIGHTS.VIEW(insightId)
    );
  },

  async dismiss(insightId: string): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(
      API_ENDPOINTS.AI.INSIGHTS.DISMISS(insightId)
    );
  },
};
