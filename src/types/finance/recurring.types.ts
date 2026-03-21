import type { FinanceEntryType, RecurrenceUnit } from './finance-entry.types';

export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

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
}

export interface UpdateRecurringConfigRequest {
  description?: string;
  expectedAmount?: number;
  frequencyUnit?: RecurrenceUnit;
  frequencyInterval?: number;
  endDate?: string | null;
  interestRate?: number | null;
  penaltyRate?: number | null;
  notes?: string | null;
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
