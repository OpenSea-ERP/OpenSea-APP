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
      `/v1/production/time-entries?jobCardId=${jobCardId}`,
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
      '/v1/production/time-entries',
      data,
    );
  },
  async end(id: string, data?: { endTime?: string; breakMinutes?: number }) {
    return apiClient.patch<{ timeEntry: TimeEntry }>(
      `/v1/production/time-entries/${id}/end`,
      data ?? {},
    );
  },
};
