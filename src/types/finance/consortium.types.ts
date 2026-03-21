import type { FinanceEntryStatus } from './finance-entry.types';

export type ConsortiumStatus =
  | 'ACTIVE'
  | 'CONTEMPLATED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Consortium {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  costCenterId: string;
  costCenterName?: string;
  name: string;
  administrator: string;
  groupNumber?: string | null;
  quotaNumber?: string | null;
  contractNumber?: string | null;
  status: ConsortiumStatus;
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  isContemplated: boolean;
  contemplatedAt?: string | null;
  contemplationType?: string | null;
  startDate: string;
  endDate?: string | null;
  paymentDay?: number | null;
  notes?: string | null;
  payments?: ConsortiumPayment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ConsortiumPayment {
  id: string;
  consortiumId: string;
  bankAccountId?: string | null;
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount?: number | null;
  paidAt?: string | null;
  status: FinanceEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsortiumData {
  bankAccountId: string;
  costCenterId: string;
  name: string;
  administrator: string;
  groupNumber?: string;
  quotaNumber?: string;
  contractNumber?: string;
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  startDate: string;
  endDate?: string;
  paymentDay?: number;
  notes?: string;
}

export type UpdateConsortiumData = Partial<
  Omit<CreateConsortiumData, 'creditValue'>
>;

export interface PayConsortiumInstallmentData {
  bankAccountId?: string;
  paidAmount: number;
  paidAt: string;
}

export interface MarkContemplatedData {
  contemplationType: 'BID' | 'DRAW';
  contemplatedAt: string;
}

export interface ConsortiaQuery {
  page?: number;
  perPage?: number;
  search?: string;
  bankAccountId?: string;
  costCenterId?: string;
  status?: ConsortiumStatus;
  isContemplated?: boolean;
  sortBy?: 'createdAt' | 'monthlyPayment' | 'administrator' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const CONSORTIUM_STATUS_LABELS: Record<ConsortiumStatus, string> = {
  ACTIVE: 'Ativo',
  CONTEMPLATED: 'Contemplado',
  WITHDRAWN: 'Desistente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};
