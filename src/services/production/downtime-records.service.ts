import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  DowntimeRecordResponse,
  DowntimeRecordsResponse,
} from '@/types/production';

export const downtimeRecordsService = {
  async list(params?: {
    workstationId?: string;
    downtimeReasonId?: string;
  }): Promise<DowntimeRecordsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.workstationId)
      searchParams.set('workstationId', params.workstationId);
    if (params?.downtimeReasonId)
      searchParams.set('downtimeReasonId', params.downtimeReasonId);
    const qs = searchParams.toString();
    return apiClient.get<DowntimeRecordsResponse>(
      `${API_ENDPOINTS.PRODUCTION.DOWNTIME_RECORDS.LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  async create(
    data: Record<string, unknown>,
  ): Promise<DowntimeRecordResponse> {
    return apiClient.post<DowntimeRecordResponse>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_RECORDS.CREATE,
      data,
    );
  },

  async end(id: string): Promise<DowntimeRecordResponse> {
    return apiClient.post<DowntimeRecordResponse>(
      API_ENDPOINTS.PRODUCTION.DOWNTIME_RECORDS.END(id),
    );
  },
};
