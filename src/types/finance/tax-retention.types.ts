// ============================================================================
// Tax Retention Types
// ============================================================================

export type TaxType = 'IRRF' | 'ISS' | 'INSS' | 'PIS' | 'COFINS' | 'CSLL';

export type PisCofinsRegime = 'CUMULATIVO' | 'NAO_CUMULATIVO';

export interface RetentionConfig {
  applyIRRF?: boolean;
  applyISS?: boolean;
  applyINSS?: boolean;
  applyPIS?: boolean;
  applyCOFINS?: boolean;
  applyCSLL?: boolean;
  issRate?: number;
  taxRegime?: PisCofinsRegime;
}

export interface TaxResult {
  taxType: TaxType;
  grossAmount: number;
  rate: number;
  amount: number;
  description: string;
}

export interface RetentionSummary {
  retentions: TaxResult[];
  totalRetained: number;
  netAmount: number;
}

export interface FinanceEntryRetention {
  id: string;
  tenantId: string;
  entryId: string;
  taxType: TaxType;
  grossAmount: number;
  rate: number;
  amount: number;
  withheld: boolean;
  description: string | null;
  createdAt: string;
}

export interface CalculateRetentionsResponse {
  summary: RetentionSummary;
}

export interface ApplyRetentionsResponse {
  summary: RetentionSummary;
  retentions: FinanceEntryRetention[];
}

export interface ListRetentionsResponse {
  retentions: FinanceEntryRetention[];
  totalRetained: number;
}

// Labels for display
export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  IRRF: 'IRRF',
  ISS: 'ISS',
  INSS: 'INSS',
  PIS: 'PIS',
  COFINS: 'COFINS',
  CSLL: 'CSLL',
};

export const PIS_COFINS_REGIME_LABELS: Record<PisCofinsRegime, string> = {
  CUMULATIVO: 'Cumulativo',
  NAO_CUMULATIVO: 'Não-Cumulativo',
};
