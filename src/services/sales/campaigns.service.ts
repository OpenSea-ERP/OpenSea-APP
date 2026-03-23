import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CampaignResponse,
  CampaignsQuery,
  CreateCampaignRequest,
  PaginatedCampaignsResponse,
  UpdateCampaignRequest,
} from '@/types/sales';

export const campaignsService = {
  async list(query?: CampaignsQuery): Promise<PaginatedCampaignsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.type) params.append('type', query.type);
    if (query?.status) params.append('status', query.status);

    const url = params.toString()
      ? `${API_ENDPOINTS.CAMPAIGNS.LIST}?${params.toString()}`
      : API_ENDPOINTS.CAMPAIGNS.LIST;

    return apiClient.get<PaginatedCampaignsResponse>(url);
  },

  async get(id: string): Promise<CampaignResponse> {
    return apiClient.get<CampaignResponse>(API_ENDPOINTS.CAMPAIGNS.GET(id));
  },

  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return apiClient.post<CampaignResponse>(
      API_ENDPOINTS.CAMPAIGNS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateCampaignRequest
  ): Promise<CampaignResponse> {
    return apiClient.put<CampaignResponse>(
      API_ENDPOINTS.CAMPAIGNS.UPDATE(id),
      data
    );
  },

  async activate(id: string): Promise<CampaignResponse> {
    return apiClient.patch<CampaignResponse>(
      API_ENDPOINTS.CAMPAIGNS.ACTIVATE(id)
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CAMPAIGNS.DELETE(id));
  },
};
