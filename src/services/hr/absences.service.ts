import { apiClient } from '@/lib/api-client';
import type { Absence } from '@/types/hr';

export interface AbsenceResponse {
  absence: Absence;
}

export interface AbsencesResponse {
  absences: Absence[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface RequestVacationAbsenceRequest {
  employeeId: string;
  vacationPeriodId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface RequestSickLeaveRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  cid: string;
  documentUrl?: string;
  reason: string;
}

export interface RejectAbsenceRequest {
  reason: string;
}

export interface ListAbsencesParams {
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface UpdateAbsenceRequest {
  type?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
}

export const absencesService = {
  async requestVacation(
    data: RequestVacationAbsenceRequest
  ): Promise<AbsenceResponse> {
    return apiClient.post<AbsenceResponse>('/v1/hr/absences/vacation', data);
  },

  async requestSickLeave(
    data: RequestSickLeaveRequest
  ): Promise<AbsenceResponse> {
    return apiClient.post<AbsenceResponse>('/v1/hr/absences/sick-leave', data);
  },

  async approve(id: string): Promise<AbsenceResponse> {
    return apiClient.patch<AbsenceResponse>(
      `/v1/hr/absences/${id}/approve`,
      {}
    );
  },

  async reject(
    id: string,
    data: RejectAbsenceRequest
  ): Promise<AbsenceResponse> {
    return apiClient.patch<AbsenceResponse>(
      `/v1/hr/absences/${id}/reject`,
      data
    );
  },

  async cancel(id: string): Promise<AbsenceResponse> {
    return apiClient.patch<AbsenceResponse>(`/v1/hr/absences/${id}/cancel`, {});
  },

  async update(
    id: string,
    data: UpdateAbsenceRequest
  ): Promise<AbsenceResponse> {
    return apiClient.put<AbsenceResponse>(`/v1/hr/absences/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/absences/${id}`);
  },

  async get(id: string): Promise<AbsenceResponse> {
    return apiClient.get<AbsenceResponse>(`/v1/hr/absences/${id}`);
  },

  async list(params?: ListAbsencesParams): Promise<AbsencesResponse> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    const qs = query.toString();
    return apiClient.get<AbsencesResponse>(
      `/v1/hr/absences${qs ? `?${qs}` : ''}`
    );
  },
};
