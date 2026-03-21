export type EnvelopeStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
export type SignatureLevel = 'SIMPLE' | 'ADVANCED' | 'QUALIFIED';
export type EnvelopeRoutingType = 'SEQUENTIAL' | 'PARALLEL' | 'HYBRID';
export type SignerRole = 'SIGNER' | 'APPROVER' | 'WITNESS' | 'REVIEWER';
export type SignerStatus = 'PENDING' | 'NOTIFIED' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
export type SignatureAuditType =
  | 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REJECTED'
  | 'REMINDED' | 'EXPIRED' | 'CANCELLED' | 'DOWNLOADED'
  | 'DOCUMENT_VERIFIED' | 'CERTIFICATE_VALIDATED'
  | 'OTP_SENT' | 'OTP_VERIFIED' | 'LINK_ACCESSED';

export interface SignatureEnvelopeSigner {
  id: string;
  tenantId: string;
  envelopeId: string;
  order: number;
  group: number;
  role: SignerRole;
  status: SignerStatus;
  userId: string | null;
  contactId: string | null;
  externalName: string | null;
  externalEmail: string | null;
  externalPhone: string | null;
  externalDocument: string | null;
  signatureLevel: SignatureLevel;
  certificateId: string | null;
  signedAt: string | null;
  signatureImageFileId: string | null;
  ipAddress: string | null;
  otpVerified: boolean;
  rejectedAt: string | null;
  rejectedReason: string | null;
  lastNotifiedAt: string | null;
  notificationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureAuditEvent {
  id: string;
  envelopeId: string;
  tenantId: string;
  type: SignatureAuditType;
  signerId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface SignatureEnvelope {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: EnvelopeStatus;
  signatureLevel: SignatureLevel;
  minSignatureLevel: SignatureLevel | null;
  documentFileId: string;
  documentHash: string;
  signedFileId: string | null;
  documentType: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: EnvelopeRoutingType;
  expiresAt: string | null;
  reminderDays: number;
  autoExpireDays: number | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdByUserId: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  signers?: SignatureEnvelopeSigner[];
  auditTrail?: SignatureAuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SignerInput {
  userId?: string;
  contactId?: string;
  externalName?: string;
  externalEmail?: string;
  externalPhone?: string;
  externalDocument?: string;
  order: number;
  group: number;
  role: SignerRole;
  signatureLevel: SignatureLevel;
  certificateId?: string;
}

export interface CreateEnvelopeData {
  title: string;
  description?: string;
  signatureLevel: SignatureLevel;
  minSignatureLevel?: SignatureLevel;
  documentFileId: string;
  documentHash: string;
  documentType?: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: EnvelopeRoutingType;
  expiresAt?: string;
  reminderDays?: number;
  autoExpireDays?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  signers: SignerInput[];
}
