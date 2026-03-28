import { apiClient } from '@/lib/api-client';
import type {
  CreateOffboardingChecklistData,
  ListOffboardingChecklistsParams,
  OffboardingChecklistResponse,
  OffboardingChecklistsResponse,
  UpdateOffboardingChecklistData,
} from '@/types/hr/offboarding.types';

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const offboardingService = {
  async listChecklists(
    params?: ListOffboardingChecklistsParams
  ): Promise<OffboardingChecklistsResponse> {
    return apiClient.get<OffboardingChecklistsResponse>(
      `/v1/hr/offboarding${buildQuery(params as Record<string, unknown>)}`
    );
  },

  async getChecklist(id: string): Promise<OffboardingChecklistResponse> {
    return apiClient.get<OffboardingChecklistResponse>(
      `/v1/hr/offboarding/${id}`
    );
  },

  async createChecklist(
    data: CreateOffboardingChecklistData
  ): Promise<OffboardingChecklistResponse> {
    return apiClient.post<OffboardingChecklistResponse>(
      '/v1/hr/offboarding',
      data
    );
  },

  async updateChecklist(
    id: string,
    data: UpdateOffboardingChecklistData
  ): Promise<OffboardingChecklistResponse> {
    return apiClient.patch<OffboardingChecklistResponse>(
      `/v1/hr/offboarding/${id}`,
      data
    );
  },

  async deleteChecklist(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/offboarding/${id}`);
  },

  async completeItem(
    checklistId: string,
    itemId: string
  ): Promise<OffboardingChecklistResponse> {
    return apiClient.post<OffboardingChecklistResponse>(
      `/v1/hr/offboarding/${checklistId}/items/${itemId}/complete`
    );
  },
};
