import type { FinanceEntryStatus } from './finance-entry.types';

export type LoanType =
  | 'PERSONAL'
  | 'BUSINESS'
  | 'WORKING_CAPITAL'
  | 'EQUIPMENT'
  | 'REAL_ESTATE'
  | 'CREDIT_LINE'
  | 'OTHER';
export type LoanStatus =
  | 'ACTIVE'
  | 'PAID_OFF'
  | 'DEFAULTED'
  | 'RENEGOTIATED'
  | 'CANCELLED';

export interface Loan {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  costCenterId: string;
  costCenterName?: string;
  name: string;
  type: LoanType;
  contractNumber?: string | null;
  status: LoanStatus;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  interestType?: string | null;
  startDate: string;
  endDate?: string | null;
  totalInstallments: number;
  paidInstallments: number;
  installmentDay?: number | null;
  notes?: string | null;
  installments?: LoanInstallment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  bankAccountId?: string | null;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount?: number | null;
  paidAt?: string | null;
  status: FinanceEntryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanData {
  bankAccountId: string;
  costCenterId: string;
  name: string;
  type: LoanType;
  contractNumber?: string;
  principalAmount: number;
  interestRate: number;
  interestType?: string;
  startDate: string;
  endDate?: string;
  totalInstallments: number;
  installmentDay?: number;
  notes?: string;
}

export type UpdateLoanData = Partial<
  Omit<CreateLoanData, 'principalAmount' | 'totalInstallments' | 'startDate'>
> & {
  endDate?: string | null;
  contractNumber?: string | null;
  notes?: string | null;
};

export interface PayLoanInstallmentData {
  bankAccountId?: string;
  paidAmount: number;
  paidAt: string;
}

export interface LoansQuery {
  page?: number;
  perPage?: number;
  search?: string;
  bankAccountId?: string;
  costCenterId?: string;
  type?: LoanType;
  status?: LoanStatus;
  // P1-40: aligned with the real backend enum. `totalAmount`/`institution`
  // were removed (they were never real columns on the Loan model) and
  // `outstandingBalance` is not part of the whitelist either — keep only
  // values the backend Zod enum accepts so we don't send 400-bound requests.
  sortBy?: 'createdAt' | 'startDate' | 'principalAmount' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  PERSONAL: 'Pessoal',
  BUSINESS: 'Empresarial',
  WORKING_CAPITAL: 'Capital de Giro',
  EQUIPMENT: 'Financ. Equipamento',
  REAL_ESTATE: 'Financ. Imobiliário',
  CREDIT_LINE: 'Linha de Crédito',
  OTHER: 'Outro',
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  ACTIVE: 'Ativo',
  PAID_OFF: 'Quitado',
  DEFAULTED: 'Inadimplente',
  RENEGOTIATED: 'Renegociado',
  CANCELLED: 'Cancelado',
};
