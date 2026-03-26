import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BlueprintResponse,
  BlueprintsQuery,
  BlueprintsResponse,
  CreateBlueprintRequest,
  UpdateBlueprintRequest,
} from '@/types/sales';

export const blueprintsService = {
  async list(query?: BlueprintsQuery): Promise<BlueprintsResponse> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.pipelineId) params.append('pipelineId', query.pipelineId);
    if (query?.status) params.append('status', query.status);

    const url = params.toString()
      ? `${API_ENDPOINTS.BLUEPRINTS.LIST}?${params.toString()}`
      : API_ENDPOINTS.BLUEPRINTS.LIST;

    return apiClient.get<BlueprintsResponse>(url);
  },

  async get(id: string): Promise<BlueprintResponse> {
    return apiClient.get<BlueprintResponse>(API_ENDPOINTS.BLUEPRINTS.GET(id));
  },

  async create(data: CreateBlueprintRequest): Promise<BlueprintResponse> {
    return apiClient.post<BlueprintResponse>(
      API_ENDPOINTS.BLUEPRINTS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateBlueprintRequest
  ): Promise<BlueprintResponse> {
    return apiClient.put<BlueprintResponse>(
      API_ENDPOINTS.BLUEPRINTS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.BLUEPRINTS.DELETE(id));
  },
};
