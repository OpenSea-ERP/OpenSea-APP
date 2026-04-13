export type ScheduleEntryStatus =
  | 'PLANNED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProductionSchedule {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEntry {
  id: string;
  scheduleId: string;
  productionOrderId: string | null;
  workstationId: string | null;
  title: string;
  startDate: string;
  endDate: string;
  status: ScheduleEntryStatus;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleResponse {
  schedule: ProductionSchedule;
}
export interface SchedulesResponse {
  schedules: ProductionSchedule[];
}
export interface ScheduleEntryResponse {
  entry: ScheduleEntry;
}
export interface ScheduleEntriesResponse {
  entries: ScheduleEntry[];
}
