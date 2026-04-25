import { apiClient } from '@/lib/api-client';
import type {
  TimeEntry,
  PunchConfiguration,
  GeofenceValidationResult,
} from '@/types/hr';
import type { PunchType } from '@/lib/pwa/punch-db';

export interface PunchRequest {
  employeeId: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

/**
 * Body for the unified Phase 4-04 endpoint POST /v1/hr/punch/clock when
 * called from the PWA (JWT auth). `requestId` is required for idempotency
 * (server-wins) so retries from the offline queue don't double-record.
 */
export interface ExecuteClockRequest extends PunchRequest {
  entryType: PunchType;
  requestId: string;
  /** ISO timestamp captured at the moment the user tapped the CTA. */
  timestamp?: string;
}

interface ExecuteClockResponseRaw {
  timeEntry: TimeEntry;
}

export const punchApi = {
  /**
   * POST /v1/hr/punch/clock — Phase 4-04 unified endpoint with idempotency
   * via `requestId` (Plan 8-01 truth #3). Replaces the legacy
   * /v1/hr/time-control/clock-(in|out) calls in both the online path and
   * the offline-queue replay path of `useOfflinePunch`.
   */
  async executeClock(data: ExecuteClockRequest): Promise<TimeEntry> {
    const response = await apiClient.post<ExecuteClockResponseRaw>(
      '/v1/hr/punch/clock',
      {
        employeeId: data.employeeId,
        entryType: data.entryType,
        timestamp: data.timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        notes: data.notes,
        requestId: data.requestId,
      }
    );
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
