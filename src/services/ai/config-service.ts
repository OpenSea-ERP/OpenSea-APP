import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { AiTenantConfig, UpdateAiConfigRequest } from '@/types/ai';

export interface AiConfigResponse {
  config: AiTenantConfig;
}

export const aiConfigService = {
  async get(): Promise<AiConfigResponse> {
    return apiClient.get<AiConfigResponse>(API_ENDPOINTS.AI.CONFIG.GET);
  },

  async update(data: UpdateAiConfigRequest): Promise<AiConfigResponse> {
    return apiClient.put<AiConfigResponse>(
      API_ENDPOINTS.AI.CONFIG.UPDATE,
      data
    );
  },
};
