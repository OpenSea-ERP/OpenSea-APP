export type TimeEntryType = 'PRODUCTION' | 'SETUP' | 'REWORK' | 'IDLE';

export interface TimeEntry {
  id: string;
  jobCardId: string;
  operatorId: string;
  startTime: string;
  endTime: string | null;
  breakMinutes: number;
  entryType: TimeEntryType;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}
