import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ConnectIntegrationRequest,
  IntegrationResponse,
  IntegrationsQuery,
  IntegrationsResponse,
} from '@/types/sales';

export const integrationsService = {
  async list(query?: IntegrationsQuery): Promise<IntegrationsResponse> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.category) params.append('category', query.category);
    if (query?.status) params.append('status', query.status);

    const url = params.toString()
      ? `${API_ENDPOINTS.SALES_INTEGRATIONS.LIST}?${params.toString()}`
      : API_ENDPOINTS.SALES_INTEGRATIONS.LIST;

    return apiClient.get<IntegrationsResponse>(url);
  },

  async get(id: string): Promise<IntegrationResponse> {
    return apiClient.get<IntegrationResponse>(
      API_ENDPOINTS.SALES_INTEGRATIONS.GET(id)
    );
  },

  async connect(
    id: string,
    data: ConnectIntegrationRequest
  ): Promise<IntegrationResponse> {
    return apiClient.post<IntegrationResponse>(
      API_ENDPOINTS.SALES_INTEGRATIONS.CONNECT(id),
      data
    );
  },

  async disconnect(id: string): Promise<void> {
    return apiClient.post<void>(
      API_ENDPOINTS.SALES_INTEGRATIONS.DISCONNECT(id),
      {}
    );
  },

  async sync(id: string): Promise<IntegrationResponse> {
    return apiClient.post<IntegrationResponse>(
      API_ENDPOINTS.SALES_INTEGRATIONS.SYNC(id),
      {}
    );
  },
};
