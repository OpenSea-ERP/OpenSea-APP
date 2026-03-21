import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { CardIntegration, CreateIntegrationRequest } from '@/types/tasks';

export interface IntegrationsResponse {
  integrations: CardIntegration[];
}

export interface IntegrationResponse {
  integration: CardIntegration;
}

export const integrationsService = {
  async list(
    boardId: string,
    cardId: string
  ): Promise<IntegrationsResponse> {
    return apiClient.get<IntegrationsResponse>(
      API_ENDPOINTS.TASKS.INTEGRATIONS.LIST(boardId, cardId)
    );
  },

  async create(
    boardId: string,
    cardId: string,
    data: CreateIntegrationRequest
  ): Promise<IntegrationResponse> {
    return apiClient.post<IntegrationResponse>(
      API_ENDPOINTS.TASKS.INTEGRATIONS.CREATE(boardId, cardId),
      data
    );
  },

  async delete(
    boardId: string,
    cardId: string,
    integrationId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      API_ENDPOINTS.TASKS.INTEGRATIONS.DELETE(boardId, cardId, integrationId)
    );
  },
};
