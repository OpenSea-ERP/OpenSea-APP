/**
 * Punch Configuration Types
 * Tipos para configuração de ponto e geofence
 */

export interface PunchConfiguration {
  id: string;
  tenantId: string;
  selfieRequired: boolean;
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  allowOfflinePunch: boolean;
  kioskModeEnabled: boolean;
  maxPhotoSizeKb: number;
  receiptEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceValidationResult {
  isValid: boolean;
  zoneName?: string;
  distance?: number;
}
