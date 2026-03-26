/**
 * OpenSea OS - Geofence Zones API
 */

import { geofenceZonesService } from '@/services/hr/geofence-zones.service';
import type {
  GeofenceZone,
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
} from '@/types/hr';

export const geofenceZonesApi = {
  async list(): Promise<GeofenceZone[]> {
    const response = await geofenceZonesService.listGeofenceZones();
    return response.geofenceZones;
  },

  async get(id: string): Promise<GeofenceZone> {
    const response = await geofenceZonesService.getGeofenceZone(id);
    return response.geofenceZone;
  },

  async create(data: CreateGeofenceZoneData): Promise<GeofenceZone> {
    const response = await geofenceZonesService.createGeofenceZone(data);
    return response.geofenceZone;
  },

  async update(
    id: string,
    data: UpdateGeofenceZoneData
  ): Promise<GeofenceZone> {
    const response = await geofenceZonesService.updateGeofenceZone(id, data);
    return response.geofenceZone;
  },

  async delete(id: string): Promise<void> {
    await geofenceZonesService.deleteGeofenceZone(id);
  },
};
