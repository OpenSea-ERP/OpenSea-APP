/**
 * GeofenceZone Types
 * Representa uma zona de geofencing para controle de ponto
 */

/**
 * GeofenceZone
 * Zona de geofencing que delimita uma area valida para registro de ponto
 */
export interface GeofenceZone {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * CreateGeofenceZoneData
 * Dados para criar uma nova zona de geofencing
 */
export interface CreateGeofenceZoneData {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  isActive?: boolean;
  address?: string | null;
}

/**
 * UpdateGeofenceZoneData
 * Dados para atualizar uma zona de geofencing
 */
export interface UpdateGeofenceZoneData {
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive?: boolean;
  address?: string | null;
}
