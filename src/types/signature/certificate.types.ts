export type CertificateType = 'A1' | 'A3' | 'CLOUD_NEOID' | 'CLOUD_BIRDID' | 'CLOUD_OTHER';
export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING_ACTIVATION';

export interface DigitalCertificate {
  id: string;
  tenantId: string;
  name: string;
  type: CertificateType;
  status: CertificateStatus;
  subjectName: string | null;
  subjectCnpj: string | null;
  subjectCpf: string | null;
  issuerName: string | null;
  serialNumber: string | null;
  validFrom: string | null;
  validUntil: string | null;
  thumbprint: string | null;
  pfxFileId: string | null;
  cloudProviderId: string | null;
  alertDaysBefore: number;
  isDefault: boolean;
  allowedModules: string[];
  lastUsedAt: string | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificateData {
  name: string;
  type: CertificateType;
  subjectName?: string;
  subjectCnpj?: string;
  subjectCpf?: string;
  issuerName?: string;
  serialNumber?: string;
  validFrom?: string;
  validUntil?: string;
  thumbprint?: string;
  pfxFileId?: string;
  pfxPassword?: string;
  cloudProviderId?: string;
  alertDaysBefore?: number;
  isDefault?: boolean;
  allowedModules?: string[];
}
