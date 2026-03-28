import { apiClient } from '@/lib/api-client';
import type {
  CreateOnboardingChecklistData,
  ListOnboardingChecklistsParams,
  OnboardingChecklistResponse,
  OnboardingChecklistsResponse,
  UpdateOnboardingChecklistData,
} from '@/types/hr/onboarding.types';

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

export const onboardingService = {
  async listChecklists(
    params?: ListOnboardingChecklistsParams
  ): Promise<OnboardingChecklistsResponse> {
    return apiClient.get<OnboardingChecklistsResponse>(
      `/v1/hr/onboarding${buildQuery(params as Record<string, unknown>)}`
    );
  },

  async getChecklist(id: string): Promise<OnboardingChecklistResponse> {
    return apiClient.get<OnboardingChecklistResponse>(
      `/v1/hr/onboarding/${id}`
    );
  },

  async createChecklist(
    data: CreateOnboardingChecklistData
  ): Promise<OnboardingChecklistResponse> {
    return apiClient.post<OnboardingChecklistResponse>(
      '/v1/hr/onboarding',
      data
    );
  },

  async updateChecklist(
    id: string,
    data: UpdateOnboardingChecklistData
  ): Promise<OnboardingChecklistResponse> {
    return apiClient.patch<OnboardingChecklistResponse>(
      `/v1/hr/onboarding/${id}`,
      data
    );
  },

  async deleteChecklist(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/onboarding/${id}`);
  },
};
