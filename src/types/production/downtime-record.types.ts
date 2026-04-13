export interface DowntimeRecord {
  id: string;
  workstationId: string;
  downtimeReasonId: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  reportedById: string;
  notes: string | null;
  createdAt: string;
}

export interface DowntimeRecordResponse { record: DowntimeRecord; }
export interface DowntimeRecordsResponse { downtimeRecords: DowntimeRecord[]; }
