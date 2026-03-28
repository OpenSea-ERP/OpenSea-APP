import { apiClient } from '@/lib/api-client';
import type {
  EmployeeWarning,
  CreateWarningData,
  UpdateWarningData,
  RevokeWarningData,
} from '@/types/hr';

export interface WarningResponse {
  warning: EmployeeWarning;
}

export interface WarningsResponse {
  warnings: EmployeeWarning[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface ListWarningsParams {
  employeeId?: string;
  type?: string;
  severity?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export const warningsService = {
  async list(params?: ListWarningsParams): Promise<WarningsResponse> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.type) query.append('type', params.type);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    const qs = query.toString();
    return apiClient.get<WarningsResponse>(
      `/v1/hr/warnings${qs ? `?${qs}` : ''}`
    );
  },

  async get(id: string): Promise<WarningResponse> {
    return apiClient.get<WarningResponse>(`/v1/hr/warnings/${id}`);
  },

  async create(data: CreateWarningData): Promise<WarningResponse> {
    return apiClient.post<WarningResponse>('/v1/hr/warnings', data);
  },

  async update(id: string, data: UpdateWarningData): Promise<WarningResponse> {
    return apiClient.put<WarningResponse>(`/v1/hr/warnings/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/warnings/${id}`);
  },

  async revoke(id: string, data: RevokeWarningData): Promise<WarningResponse> {
    return apiClient.patch<WarningResponse>(
      `/v1/hr/warnings/${id}/revoke`,
      data
    );
  },

  async acknowledge(id: string): Promise<WarningResponse> {
    return apiClient.patch<WarningResponse>(
      `/v1/hr/warnings/${id}/acknowledge`,
      {}
    );
  },
};
