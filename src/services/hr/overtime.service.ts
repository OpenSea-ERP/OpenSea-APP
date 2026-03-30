import { apiClient } from '@/lib/api-client';
import type { Overtime } from '@/types/hr';

export interface OvertimeResponse {
  overtime: Overtime;
}

export interface OvertimeListResponse {
  overtime: Overtime[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CreateOvertimeRequest {
  employeeId: string;
  date: string;
  hours: number;
  reason: string;
}

export interface ApproveOvertimeRequest {
  addToTimeBank?: boolean;
}

export interface ListOvertimeParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  approved?: boolean;
  page?: number;
  perPage?: number;
}

export const overtimeService = {
  async create(data: CreateOvertimeRequest): Promise<OvertimeResponse> {
    return apiClient.post<OvertimeResponse>('/v1/hr/overtime', data);
  },

  async approve(
    overtimeId: string,
    data?: ApproveOvertimeRequest
  ): Promise<OvertimeResponse> {
    return apiClient.post<OvertimeResponse>(
      `/v1/hr/overtime/${overtimeId}/approve`,
      data ?? {}
    );
  },

  async get(overtimeId: string): Promise<OvertimeResponse> {
    return apiClient.get<OvertimeResponse>(`/v1/hr/overtime/${overtimeId}`);
  },

  async update(
    overtimeId: string,
    data: Partial<CreateOvertimeRequest>
  ): Promise<OvertimeResponse> {
    return apiClient.put<OvertimeResponse>(
      `/v1/hr/overtime/${overtimeId}`,
      data
    );
  },

  async delete(overtimeId: string): Promise<void> {
    await apiClient.delete(`/v1/hr/overtime/${overtimeId}`);
  },

  async reject(
    overtimeId: string,
    data?: { reason?: string }
  ): Promise<OvertimeResponse> {
    return apiClient.post<OvertimeResponse>(
      `/v1/hr/overtime/${overtimeId}/reject`,
      data ?? {}
    );
  },

  async list(params?: ListOvertimeParams): Promise<OvertimeListResponse> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.approved !== undefined)
      query.append('approved', String(params.approved));
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    const qs = query.toString();
    return apiClient.get<OvertimeListResponse>(
      `/v1/hr/overtime${qs ? `?${qs}` : ''}`
    );
  },
};
