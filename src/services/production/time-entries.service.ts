import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface TimeEntry {
  id: string;
  jobCardId: string;
  operatorId: string;
  startTime: string;
  endTime: string | null;
  breakMinutes: number;
  entryType: 'PRODUCTION' | 'SETUP' | 'REWORK' | 'IDLE';
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

export const timeEntriesService = {
  async list(jobCardId: string) {
    return apiClient.get<{ timeEntries: TimeEntry[] }>(
      `${API_ENDPOINTS.PRODUCTION.TIME_ENTRIES.LIST}?jobCardId=${jobCardId}`
    );
  },
  async create(data: {
    jobCardId: string;
    startTime: string;
    endTime?: string;
    breakMinutes?: number;
    entryType?: string;
    notes?: string;
  }) {
    return apiClient.post<{ timeEntry: TimeEntry }>(
      API_ENDPOINTS.PRODUCTION.TIME_ENTRIES.CREATE,
      data
    );
  },
  async end(id: string, data?: { endTime?: string; breakMinutes?: number }) {
    return apiClient.patch<{ timeEntry: TimeEntry }>(
      API_ENDPOINTS.PRODUCTION.TIME_ENTRIES.END(id),
      data ?? {}
    );
  },
};
