import { apiClient } from '@/lib/api-client';
import { timeControlService } from '@/services/hr';
import type { ClockInOutRequest } from '@/services/hr/time-control.service';
import type {
  TimeEntry,
  PunchConfiguration,
  GeofenceValidationResult,
} from '@/types/hr';

export interface PunchRequest {
  employeeId: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export const punchApi = {
  async clockIn(data: PunchRequest): Promise<TimeEntry> {
    const request: ClockInOutRequest = {
      employeeId: data.employeeId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes,
    };
    const response = await timeControlService.clockIn(request);
    return response.timeEntry;
  },

  async clockOut(data: PunchRequest): Promise<TimeEntry> {
    const request: ClockInOutRequest = {
      employeeId: data.employeeId,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes,
    };
    const response = await timeControlService.clockOut(request);
    return response.timeEntry;
  },

  async getConfig(): Promise<PunchConfiguration> {
    return apiClient.get<PunchConfiguration>('/v1/hr/punch-config');
  },

  async validateGeofence(
    lat: number,
    lng: number
  ): Promise<GeofenceValidationResult> {
    return apiClient.post<GeofenceValidationResult>(
      '/v1/hr/geofence-zones/validate',
      { latitude: lat, longitude: lng }
    );
  },
};
