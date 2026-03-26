import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateLandingPageRequest,
  LandingPageResponse,
  LandingPagesQuery,
  LandingPagesResponse,
  UpdateLandingPageRequest,
} from '@/types/sales';

export const landingPagesService = {
  async list(query?: LandingPagesQuery): Promise<LandingPagesResponse> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.template) params.append('template', query.template);

    const url = params.toString()
      ? `${API_ENDPOINTS.LANDING_PAGES.LIST}?${params.toString()}`
      : API_ENDPOINTS.LANDING_PAGES.LIST;

    return apiClient.get<LandingPagesResponse>(url);
  },

  async get(id: string): Promise<LandingPageResponse> {
    return apiClient.get<LandingPageResponse>(
      API_ENDPOINTS.LANDING_PAGES.GET(id)
    );
  },

  async create(data: CreateLandingPageRequest): Promise<LandingPageResponse> {
    return apiClient.post<LandingPageResponse>(
      API_ENDPOINTS.LANDING_PAGES.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateLandingPageRequest
  ): Promise<LandingPageResponse> {
    return apiClient.put<LandingPageResponse>(
      API_ENDPOINTS.LANDING_PAGES.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.LANDING_PAGES.DELETE(id));
  },

  async publish(id: string): Promise<LandingPageResponse> {
    return apiClient.post<LandingPageResponse>(
      API_ENDPOINTS.LANDING_PAGES.PUBLISH(id),
      {}
    );
  },

  async unpublish(id: string): Promise<LandingPageResponse> {
    return apiClient.post<LandingPageResponse>(
      API_ENDPOINTS.LANDING_PAGES.UNPUBLISH(id),
      {}
    );
  },
};
