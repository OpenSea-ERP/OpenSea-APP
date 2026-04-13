import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ScheduleResponse,
  SchedulesResponse,
  ScheduleEntryResponse,
  ScheduleEntriesResponse,
} from '@/types/production';

export const schedulesService = {
  async list(): Promise<SchedulesResponse> {
    return apiClient.get<SchedulesResponse>(
      API_ENDPOINTS.PRODUCTION.SCHEDULES.LIST
    );
  },

  async getById(id: string): Promise<ScheduleResponse> {
    return apiClient.get<ScheduleResponse>(
      API_ENDPOINTS.PRODUCTION.SCHEDULES.GET(id)
    );
  },

  async create(data: Record<string, unknown>): Promise<ScheduleResponse> {
    return apiClient.post<ScheduleResponse>(
      API_ENDPOINTS.PRODUCTION.SCHEDULES.CREATE,
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.SCHEDULES.DELETE(id)
    );
  },

  async listEntries(params?: {
    scheduleId?: string;
    status?: string;
  }): Promise<ScheduleEntriesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.scheduleId) searchParams.set('scheduleId', params.scheduleId);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return apiClient.get<ScheduleEntriesResponse>(
      `${API_ENDPOINTS.PRODUCTION.SCHEDULE_ENTRIES.LIST}${qs ? `?${qs}` : ''}`
    );
  },

  async createEntry(
    data: Record<string, unknown>
  ): Promise<ScheduleEntryResponse> {
    return apiClient.post<ScheduleEntryResponse>(
      API_ENDPOINTS.PRODUCTION.SCHEDULE_ENTRIES.CREATE,
      data
    );
  },

  async updateEntry(
    id: string,
    data: Record<string, unknown>
  ): Promise<ScheduleEntryResponse> {
    return apiClient.put<ScheduleEntryResponse>(
      API_ENDPOINTS.PRODUCTION.SCHEDULE_ENTRIES.UPDATE(id),
      data
    );
  },

  async deleteEntry(id: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.PRODUCTION.SCHEDULE_ENTRIES.DELETE(id)
    );
  },
};
