import { apiClient } from '@/lib/api-client';
import type { VacationPeriod } from '@/types/hr';

export interface VacationPeriodResponse {
  vacationPeriod: VacationPeriod;
}

export interface VacationPeriodsResponse {
  vacationPeriods: VacationPeriod[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface CreateVacationPeriodRequest {
  employeeId: string;
  acquisitionStart: string;
  acquisitionEnd: string;
  concessionStart: string;
  concessionEnd: string;
  totalDays?: number;
  notes?: string;
}

export interface ScheduleVacationRequest {
  startDate: string;
  endDate: string;
  days: number;
}

export interface CompleteVacationRequest {
  daysUsed: number;
}

export interface SellVacationDaysRequest {
  daysToSell: number;
}

export interface ListVacationPeriodsParams {
  employeeId?: string;
  status?: string;
  year?: number;
  page?: number;
  perPage?: number;
}

export interface VacationBalanceResponse {
  employeeId: string;
  employeeName: string;
  totalAvailableDays: number;
  totalUsedDays: number;
  totalSoldDays: number;
  periods: {
    acquisitionPeriod: string;
    concessionDeadline: string;
    totalDays: number;
    usedDays: number;
    soldDays: number;
    remainingDays: number;
    status: string;
    isExpired: boolean;
    daysUntilExpiration: number;
  }[];
}

export interface UpdateVacationPeriodRequest {
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  notes?: string;
}

export const vacationsService = {
  async create(
    data: CreateVacationPeriodRequest
  ): Promise<VacationPeriodResponse> {
    return apiClient.post<VacationPeriodResponse>(
      '/v1/hr/vacation-periods',
      data
    );
  },

  async schedule(
    id: string,
    data: ScheduleVacationRequest
  ): Promise<VacationPeriodResponse> {
    return apiClient.patch<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}/schedule`,
      data
    );
  },

  async start(id: string): Promise<VacationPeriodResponse> {
    return apiClient.patch<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}/start`,
      {}
    );
  },

  async complete(
    id: string,
    data: CompleteVacationRequest
  ): Promise<VacationPeriodResponse> {
    return apiClient.patch<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}/complete`,
      data
    );
  },

  async sellDays(
    id: string,
    data: SellVacationDaysRequest
  ): Promise<VacationPeriodResponse> {
    return apiClient.patch<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}/sell`,
      data
    );
  },

  async cancelSchedule(id: string): Promise<VacationPeriodResponse> {
    return apiClient.patch<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}/cancel-schedule`,
      {}
    );
  },

  async update(
    id: string,
    data: UpdateVacationPeriodRequest
  ): Promise<VacationPeriodResponse> {
    return apiClient.put<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}`,
      data
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/vacation-periods/${id}`);
  },

  async get(id: string): Promise<VacationPeriodResponse> {
    return apiClient.get<VacationPeriodResponse>(
      `/v1/hr/vacation-periods/${id}`
    );
  },

  async list(
    params?: ListVacationPeriodsParams
  ): Promise<VacationPeriodsResponse> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status) query.append('status', params.status);
    if (params?.year) query.append('year', String(params.year));
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));
    const qs = query.toString();
    return apiClient.get<VacationPeriodsResponse>(
      `/v1/hr/vacation-periods${qs ? `?${qs}` : ''}`
    );
  },

  async getVacationBalance(
    employeeId: string
  ): Promise<VacationBalanceResponse> {
    return apiClient.get<VacationBalanceResponse>(
      `/v1/hr/employees/${employeeId}/vacation-balance`
    );
  },
};
