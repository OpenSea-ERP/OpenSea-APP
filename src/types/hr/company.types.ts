// Company Types

import type { Department } from './department.types';
import type { Employee } from './employee.types';

/**
 * CompanyStatus
 * Status possíveis para uma empresa
 */
export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * CompanyTaxRegime
 * Regimes tributários suportados
 */
export type CompanyTaxRegime =
  | 'SIMPLES'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'IMUNE_ISENTA'
  | 'OUTROS';

/**
 * Company
 * Representa uma empresa na organização
 */
export interface Company {
  id: string;
  legalName: string;
  tradeName?: string | null;
  cnpj: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  legalNature?: string | null;
  taxRegime?: CompanyTaxRegime | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: string | null;
  status: CompanyStatus;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Dados enriquecidos da API
  _count?: {
    departments?: number;
    employees?: number;
  };
  departments?: Department[];
  employees?: Employee[];
}

/**
 * CreateCompanyData
 * Dados para criar uma nova empresa
 */
export interface CreateCompanyData {
  legalName: string;
  tradeName?: string | null;
  cnpj: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  legalNature?: string | null;
  taxRegime?: CompanyTaxRegime;
  taxRegimeDetail?: string | null;
  activityStartDate?: string | null;
  status?: CompanyStatus;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
}

/**
 * UpdateCompanyData
 * Dados para atualizar uma empresa existente
 */
export interface UpdateCompanyData {
  legalName?: string;
  tradeName?: string | null;
  cnpj?: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  legalNature?: string | null;
  taxRegime?: CompanyTaxRegime;
  taxRegimeDetail?: string | null;
  activityStartDate?: string | null;
  status?: CompanyStatus;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
}

// ----------------------------------------------------------------------------
// CompanyAddress
// ----------------------------------------------------------------------------

export type CompanyAddressType = 'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER';

export interface CompanyAddress {
  id: string;
  companyId: string;
  type: CompanyAddressType;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip: string;
  ibgeCityCode?: string | null;
  countryCode?: string | null;
  isPrimary: boolean;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCompanyAddressData {
  type: CompanyAddressType;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip: string;
  ibgeCityCode?: string | null;
  countryCode?: string | null;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

export type UpdateCompanyAddressData = Partial<CreateCompanyAddressData>;

// ----------------------------------------------------------------------------
// CompanyCNAE
// ----------------------------------------------------------------------------

export interface CompanyCnae {
  id: string;
  companyId: string;
  code: string;
  description?: string | null;
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCompanyCnaeData {
  code: string;
  description?: string | null;
  isPrimary?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, unknown>;
}

export type UpdateCompanyCnaeData = Partial<CreateCompanyCnaeData>;

// ----------------------------------------------------------------------------
// CompanyFiscalSettings
// ----------------------------------------------------------------------------

export interface CompanyFiscalSettings {
  id: string;
  companyId: string;
  nfeEnvironment?: 'PRODUCTION' | 'HOMOLOGATION';
  nfeSeries?: string | null;
  nfeLastNumber?: number | null;
  nfeDefaultOperationNature?: string | null;
  nfeDefaultCfop?: string | null;
  digitalCertificateType?: 'NONE' | 'A1' | 'A3';
  certificateA1ExpiresAt?: string | null;
  nfceEnabled?: boolean;
  nfceCscId?: string | null;
  defaultTaxProfileId?: string | null;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreateCompanyFiscalSettingsData = Omit<
  CompanyFiscalSettings,
  'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'pendingIssues'
>;

export type UpdateCompanyFiscalSettingsData =
  Partial<CreateCompanyFiscalSettingsData>;

// ----------------------------------------------------------------------------
// CompanyStakeholder
// ----------------------------------------------------------------------------

export interface CompanyStakeholder {
  id: string;
  companyId: string;
  name: string;
  role?: string | null;
  personDocumentMasked?: string | null;
  isLegalRepresentative?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  entryDate?: string | null;
  exitDate?: string | null;
  source: string;
  rawPayloadRef?: string | null;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCompanyStakeholderData {
  name: string;
  role?: string | null;
  personDocumentMasked?: string | null;
  isLegalRepresentative?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  entryDate?: string | null;
  exitDate?: string | null;
  source?: string | null;
  rawPayloadRef?: string | null;
  metadata?: Record<string, unknown>;
}

export type UpdateCompanyStakeholderData =
  Partial<CreateCompanyStakeholderData>;
