/**
 * OpenSea OS - Finance Compliance Types
 *
 * Tipos para funcionalidades de compliance fiscal:
 * - Simples Nacional
 * - Calendário Fiscal (Tax Calendar)
 * - Obrigações Tributárias (Tax Obligations)
 * - Exportação SPED ECD
 */

// =============================================================================
// Tax Obligation
// =============================================================================

export type TaxObligationStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type TaxType =
  | 'IRRF'
  | 'ISS'
  | 'INSS'
  | 'PIS'
  | 'COFINS'
  | 'CSLL'
  | 'IRPJ'
  | 'ICMS'
  | 'IPI'
  | 'FGTS'
  | 'OTHER';

export interface TaxObligation {
  id: string;
  taxType: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  amount: number;
  status: TaxObligationStatus;
  paidAt: string | null;
  darfCode: string | null;
  entryId: string | null;
}

// =============================================================================
// Simples Nacional
// =============================================================================

export type SimplesNacionalStatus = 'OK' | 'WARNING' | 'EXCEEDED';

export interface SimplesNacionalValidation {
  regime: string;
  annualRevenue: number;
  limit: number;
  percentUsed: number;
  status: SimplesNacionalStatus;
  message: string;
}

// =============================================================================
// Tax Calendar
// =============================================================================

export interface TaxCalendarResponse {
  obligations: TaxObligation[];
  month: number;
  year: number;
}

export interface SimplesNacionalResponse {
  validation: SimplesNacionalValidation;
}

// =============================================================================
// Generate DARFs
// =============================================================================

export interface GenerateDarfsRequest {
  month: number;
  year: number;
}

export interface GenerateDarfsResponse {
  generated: number;
  obligations: TaxObligation[];
}

// =============================================================================
// Labels
// =============================================================================

export const TAX_OBLIGATION_STATUS_LABELS: Record<TaxObligationStatus, string> =
  {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Vencido',
    CANCELLED: 'Cancelado',
  };

export const COMPLIANCE_TAX_TYPE_LABELS: Record<string, string> = {
  IRRF: 'IRRF',
  ISS: 'ISS',
  INSS: 'INSS',
  PIS: 'PIS',
  COFINS: 'COFINS',
  CSLL: 'CSLL',
  IRPJ: 'IRPJ',
  ICMS: 'ICMS',
  IPI: 'IPI',
  FGTS: 'FGTS',
  OTHER: 'Outro',
};
