import type { FinanceEntryType, RecurrenceUnit } from './finance-entry.types';

export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type IndexationType = 'NONE' | 'IPCA' | 'IGPM' | 'FIXED_RATE';

export interface RecurringConfig {
  id: string;
  tenantId: string;
  type: FinanceEntryType;
  status: RecurringStatus;
  description: string;
  categoryId: string;
  costCenterId?: string | null;
  bankAccountId?: string | null;
  supplierName?: string | null;
  customerName?: string | null;
  supplierId?: string | null;
  customerId?: string | null;
  expectedAmount: number;
  isVariable: boolean;
  frequencyUnit: RecurrenceUnit;
  frequencyInterval: number;
  startDate: string;
  endDate?: string | null;
  totalOccurrences?: number | null;
  generatedCount: number;
  lastGeneratedDate?: string | null;
  nextDueDate?: string | null;
  interestRate?: number | null;
  penaltyRate?: number | null;
  notes?: string | null;
  indexationType?: IndexationType | null;
  fixedAdjustmentRate?: number | null;
  lastAdjustmentDate?: string | null;
  adjustmentMonth?: number | null;
  adjustBusinessDays?: boolean | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateRecurringConfigRequest {
  type: FinanceEntryType;
  description: string;
  categoryId: string;
  costCenterId?: string;
  bankAccountId?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  expectedAmount: number;
  isVariable?: boolean;
  frequencyUnit: RecurrenceUnit;
  frequencyInterval?: number;
  startDate: string;
  endDate?: string;
  totalOccurrences?: number;
  interestRate?: number;
  penaltyRate?: number;
  notes?: string;
  indexationType?: IndexationType;
  fixedAdjustmentRate?: number;
  adjustmentMonth?: number;
  adjustBusinessDays?: boolean;
}

export interface UpdateRecurringConfigRequest {
  description?: string;
  expectedAmount?: number;
  frequencyUnit?: RecurrenceUnit;
  frequencyInterval?: number;
  endDate?: string | null;
  totalOccurrences?: number | null;
  interestRate?: number | null;
  penaltyRate?: number | null;
  notes?: string | null;
  indexationType?: IndexationType | null;
  fixedAdjustmentRate?: number | null;
  adjustmentMonth?: number | null;
  adjustBusinessDays?: boolean | null;
}

export interface RecurringConfigsQuery {
  page?: number;
  limit?: number;
  type?: FinanceEntryType;
  status?: RecurringStatus;
  search?: string;
  sortBy?: 'createdAt' | 'description' | 'expectedAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const RECURRING_STATUS_LABELS: Record<RecurringStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

export const FREQUENCY_LABELS: Record<RecurrenceUnit, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export const INDEXATION_TYPE_LABELS: Record<IndexationType, string> = {
  NONE: 'Nenhuma',
  IPCA: 'IPCA',
  IGPM: 'IGP-M',
  FIXED_RATE: 'Taxa Fixa',
};

export const MONTH_LABELS: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};
