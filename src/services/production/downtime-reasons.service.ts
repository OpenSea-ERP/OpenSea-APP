import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateDowntimeReasonRequest,
  DowntimeReasonResponse,
  DowntimeReasonsResponse,
  UpdateDowntimeReasonRequest,
} from '@/types/production';

export const downtimeReasonsService = {
  async list(): Promise<DowntimeReasonsResponse> {
    return apiClient.get<DowntimeReasonsResponse>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_REASONS.LIST,
    );
  },

  async create(
    data: CreateDowntimeReasonRequest,
  ): Promise<DowntimeReasonResponse> {
    return apiClient.post<DowntimeReasonResponse>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_REASONS.CREATE,
      data,
    );
  },

  async update(
    id: string,
    data: UpdateDowntimeReasonRequest,
  ): Promise<DowntimeReasonResponse> {
    return apiClient.put<DowntimeReasonResponse>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_REASONS.UPDATE(id),
      data,
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_REASONS.DELETE(id),
    );
  },
};
