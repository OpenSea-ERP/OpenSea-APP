import type { SignatureLevel, EnvelopeRoutingType } from './envelope.types';

export interface SignerSlot {
  order: number;
  group: number;
  role: string;
  label: string;
  signatureLevel?: string;
}

export interface SignatureTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  signatureLevel: SignatureLevel;
  routingType: EnvelopeRoutingType;
  signerSlots: SignerSlot[];
  expirationDays: number | null;
  reminderDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  signatureLevel: SignatureLevel;
  routingType: EnvelopeRoutingType;
  signerSlots: SignerSlot[];
  expirationDays?: number;
  reminderDays?: number;
}
