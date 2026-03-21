import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { AiActionLog } from '@/types/ai';

export interface ActionLogsResponse {
  actions: AiActionLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const aiActionsService = {
  async list(params?: {
    status?: string;
    targetModule?: string;
    page?: number;
    limit?: number;
  }): Promise<ActionLogsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.targetModule) query.append('targetModule', params.targetModule);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.AI.ACTIONS.LIST}?${queryString}`
      : API_ENDPOINTS.AI.ACTIONS.LIST;

    return apiClient.get<ActionLogsResponse>(url);
  },
};
