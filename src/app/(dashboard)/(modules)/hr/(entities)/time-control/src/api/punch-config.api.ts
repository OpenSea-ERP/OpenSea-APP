import { apiClient } from '@/lib/api-client';
import type { PunchConfiguration, UpdatePunchConfigData } from '@/types/hr';
import type {
  GeofenceZone,
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
} from '@/types/hr';

export type {
  PunchConfiguration,
  UpdatePunchConfigData,
  GeofenceZone,
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
};

// =============================================================================
// API
// =============================================================================

export const punchConfigApi = {
  getConfig: () => apiClient.get<PunchConfiguration>('/v1/hr/punch-config'),

  updateConfig: (data: UpdatePunchConfigData) =>
    apiClient.patch<PunchConfiguration>('/v1/hr/punch-config', data),

  listZones: () =>
    apiClient.get<{ zones: GeofenceZone[] }>('/v1/hr/geofence-zones'),

  createZone: (data: CreateGeofenceZoneData) =>
    apiClient.post<GeofenceZone>('/v1/hr/geofence-zones', data),

  updateZone: (id: string, data: UpdateGeofenceZoneData) =>
    apiClient.patch<GeofenceZone>(`/v1/hr/geofence-zones/${id}`, data),

  deleteZone: (id: string) => apiClient.delete(`/v1/hr/geofence-zones/${id}`),
};
