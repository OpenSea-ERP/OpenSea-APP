export type FiscalDocumentType = 'NFE' | 'NFCE' | 'NFSE';
export type FiscalDocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CANCELLED'
  | 'DENIED'
  | 'CORRECTED'
  | 'INUTILIZED';
export type FiscalProviderType =
  | 'NUVEM_FISCAL'
  | 'FOCUS_NFE'
  | 'WEBMANIABR'
  | 'NFEWIZARD';
export type NfeEnvironment = 'HOMOLOGATION' | 'PRODUCTION';
export type TaxRegime =
  | 'SIMPLES'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'IMUNE_ISENTA';

export interface FiscalConfigDTO {
  id: string;
  tenantId: string;
  provider: FiscalProviderType;
  environment: NfeEnvironment;
  defaultSeries: number;
  lastNfeNumber: number;
  lastNfceNumber: number;
  defaultCfop?: string;
  defaultNaturezaOperacao?: string;
  taxRegime: TaxRegime;
  nfceEnabled: boolean;
  nfceCscId?: string;
  nfceCscToken?: string;
  contingencyMode: boolean;
  contingencyReason?: string;
  certificateId?: string;
  certificate?: FiscalCertificateDTO;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalCertificateDTO {
  id: string;
  tenantId: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

export interface FiscalDocumentDTO {
  id: string;
  tenantId: string;
  type: FiscalDocumentType;
  series: number;
  number: number;
  accessKey?: string;
  status: FiscalDocumentStatus;
  recipientName?: string;
  recipientCnpjCpf?: string;
  naturezaOperacao?: string;
  totalProducts: number;
  totalTax: number;
  totalValue: number;
  danfePdfUrl?: string;
  protocolNumber?: string;
  protocolDate?: string;
  orderId?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalDocumentItemDTO {
  id: string;
  itemNumber: number;
  productName: string;
  productCode?: string;
  ncm?: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  icmsRate: number;
  icmsValue: number;
  createdAt: string;
}

export interface FiscalDocumentDetailDTO extends FiscalDocumentDTO {
  items: FiscalDocumentItemDTO[];
  events: FiscalDocumentEventDTO[];
  taxes?: FiscalDocumentTaxDTO;
}

export interface FiscalDocumentEventDTO {
  id: string;
  type: string;
  description: string;
  protocolNumber?: string;
  createdAt: string;
}

export interface FiscalDocumentTaxDTO {
  icmsTotal: number;
  ipiTotal: number;
  pisTotal: number;
  cofinsTotal: number;
  issTotal: number;
  totalTax: number;
}

export interface FiscalDocumentsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  type?: FiscalDocumentType;
  status?: FiscalDocumentStatus;
  sortBy?: 'createdAt' | 'number' | 'totalValue' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface EmitNfeData {
  orderId?: string;
  recipientName: string;
  recipientCnpjCpf: string;
  naturezaOperacao: string;
  cfop: string;
  items: Array<{
    productName: string;
    productCode?: string;
    ncm?: string;
    cfop: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface EmitNfceData {
  recipientName?: string;
  recipientCnpjCpf?: string;
  items: Array<{
    productName: string;
    productCode?: string;
    ncm?: string;
    cfop: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CancelDocumentData {
  reason: string;
}

export interface CorrectionLetterData {
  correctionText: string;
}

export interface UpdateFiscalConfigData {
  provider?: FiscalProviderType;
  environment?: NfeEnvironment;
  defaultSeries?: number;
  defaultCfop?: string;
  defaultNaturezaOperacao?: string;
  taxRegime?: TaxRegime;
  nfceEnabled?: boolean;
  apiKey?: string;
  apiSecret?: string;
  nfceCscId?: string;
  nfceCscToken?: string;
  contingencyMode?: boolean;
  contingencyReason?: string;
}

// ============================================================================
// LABELS
// ============================================================================

export const FISCAL_DOCUMENT_TYPE_LABELS: Record<FiscalDocumentType, string> = {
  NFE: 'NF-e',
  NFCE: 'NFC-e',
  NFSE: 'NFS-e',
};

export const FISCAL_DOCUMENT_STATUS_LABELS: Record<
  FiscalDocumentStatus,
  string
> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  AUTHORIZED: 'Autorizada',
  CANCELLED: 'Cancelada',
  DENIED: 'Denegada',
  CORRECTED: 'Corrigida',
  INUTILIZED: 'Inutilizada',
};

export const FISCAL_PROVIDER_LABELS: Record<FiscalProviderType, string> = {
  NUVEM_FISCAL: 'Nuvem Fiscal',
  FOCUS_NFE: 'Focus NFe',
  WEBMANIABR: 'WebmaniaBR',
  NFEWIZARD: 'NFe Wizard',
};

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  SIMPLES: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  IMUNE_ISENTA: 'Imune / Isenta',
};

export const NFE_ENVIRONMENT_LABELS: Record<NfeEnvironment, string> = {
  HOMOLOGATION: 'Homologacao',
  PRODUCTION: 'Producao',
};
