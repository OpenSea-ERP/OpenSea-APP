import { apiClient } from '@/lib/api-client';
import type {
  GeofenceZone,
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
} from '@/types/hr';

export interface GeofenceZonesResponse {
  geofenceZones: GeofenceZone[];
}

export interface GeofenceZoneResponse {
  geofenceZone: GeofenceZone;
}

export const geofenceZonesService = {
  // GET /v1/hr/geofence-zones
  async listGeofenceZones(): Promise<GeofenceZonesResponse> {
    return apiClient.get<GeofenceZonesResponse>('/v1/hr/geofence-zones');
  },

  // GET /v1/hr/geofence-zones/:id
  async getGeofenceZone(id: string): Promise<GeofenceZoneResponse> {
    return apiClient.get<GeofenceZoneResponse>(`/v1/hr/geofence-zones/${id}`);
  },

  // POST /v1/hr/geofence-zones
  async createGeofenceZone(
    data: CreateGeofenceZoneData
  ): Promise<GeofenceZoneResponse> {
    return apiClient.post<GeofenceZoneResponse>('/v1/hr/geofence-zones', data);
  },

  // PATCH /v1/hr/geofence-zones/:id
  async updateGeofenceZone(
    id: string,
    data: UpdateGeofenceZoneData
  ): Promise<GeofenceZoneResponse> {
    return apiClient.patch<GeofenceZoneResponse>(
      `/v1/hr/geofence-zones/${id}`,
      data
    );
  },

  // DELETE /v1/hr/geofence-zones/:id
  async deleteGeofenceZone(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/geofence-zones/${id}`);
  },
};
