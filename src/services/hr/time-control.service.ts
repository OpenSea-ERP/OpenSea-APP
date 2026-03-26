import { apiClient } from '@/lib/api-client';
import type { TimeEntry } from '@/types/hr';

export interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface TimeEntryResponse {
  timeEntry: TimeEntry;
}

export interface ClockInOutRequest {
  employeeId: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
}

export interface CalculateWorkedHoursRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
}

export interface DailyBreakdown {
  date: string;
  workedHours: number;
  breakHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface WorkedHoursResponse {
  employeeId: string;
  startDate: string;
  endDate: string;
  dailyBreakdown: DailyBreakdown[];
  totalWorkedHours: number;
  totalBreakHours: number;
  totalOvertimeHours: number;
  totalNetHours: number;
}

export interface ListTimeEntriesParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  entryType?: string;
  page?: number;
  perPage?: number;
}

export const timeControlService = {
  async clockIn(data: ClockInOutRequest): Promise<TimeEntryResponse> {
    return apiClient.post<TimeEntryResponse>(
      '/v1/hr/time-control/clock-in',
      data
    );
  },

  async clockOut(data: ClockInOutRequest): Promise<TimeEntryResponse> {
    return apiClient.post<TimeEntryResponse>(
      '/v1/hr/time-control/clock-out',
      data
    );
  },

  async calculateWorkedHours(
    data: CalculateWorkedHoursRequest
  ): Promise<WorkedHoursResponse> {
    return apiClient.post<WorkedHoursResponse>(
      '/v1/hr/time-control/calculate-hours',
      data
    );
  },

  async getTimeEntry(id: string): Promise<TimeEntryResponse> {
    return apiClient.get<TimeEntryResponse>(
      `/v1/hr/time-control/entries/${id}`
    );
  },

  async listTimeEntries(
    params?: ListTimeEntriesParams
  ): Promise<TimeEntriesResponse> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.entryType) query.append('entryType', params.entryType);
    if (params?.page) query.append('page', String(params.page));
    if (params?.perPage) query.append('perPage', String(params.perPage));

    const qs = query.toString();
    return apiClient.get<TimeEntriesResponse>(
      `/v1/hr/time-control/entries${qs ? `?${qs}` : ''}`
    );
  },
};
