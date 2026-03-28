/**
 * Employee Warning Types (HR)
 */

export type WarningType =
  | 'VERBAL'
  | 'WRITTEN'
  | 'SUSPENSION'
  | 'TERMINATION_WARNING';

export type WarningSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type WarningStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface EmployeeWarning {
  id: string;
  employeeId: string;
  issuedBy: string;
  type: WarningType;
  severity: WarningSeverity;
  status: WarningStatus;
  reason: string;
  description?: string | null;
  incidentDate: string;
  witnessName?: string | null;
  employeeAcknowledged: boolean;
  acknowledgedAt?: string | null;
  suspensionDays?: number | null;
  attachmentUrl?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarningData {
  employeeId: string;
  issuedBy: string;
  type: WarningType;
  severity: WarningSeverity;
  reason: string;
  description?: string;
  incidentDate: string;
  witnessName?: string;
  suspensionDays?: number;
  attachmentUrl?: string;
}

export interface UpdateWarningData {
  type?: WarningType;
  severity?: WarningSeverity;
  reason?: string;
  description?: string | null;
  incidentDate?: string;
  witnessName?: string | null;
  suspensionDays?: number | null;
  attachmentUrl?: string | null;
}

export interface RevokeWarningData {
  revokeReason: string;
}
