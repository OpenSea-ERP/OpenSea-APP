export type EsocialEnvironment =
  | 'PRODUCAO'
  | 'PRODUCAO_RESTRITA'
  | 'HOMOLOGACAO';

export interface EsocialConfig {
  id: string;
  environment: EsocialEnvironment;
  autoGenerate: boolean;
  requireApproval: boolean;
  employerType: string;
  employerDocument: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEsocialConfigData {
  environment?: EsocialEnvironment;
  autoGenerate?: boolean;
  requireApproval?: boolean;
  employerType?: string;
  employerDocument?: string;
}

export interface EsocialConfigResponse {
  config: EsocialConfig;
}

export interface EsocialDashboard {
  totalEvents: number;
  byStatus: Record<string, number>;
  pendingDeadlines: number;
  certificateExpiry: {
    daysLeft: number;
    validUntil: string | null;
    isExpired: boolean;
    hasCertificate: boolean;
  };
  lastTransmission: string | null;
  rejectedEvents: Array<{
    id: string;
    eventType: string;
    referenceName: string | null;
    rejectionCode: string | null;
    rejectionMessage: string | null;
    createdAt: string;
  }>;
}
