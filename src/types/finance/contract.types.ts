export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'RENEWED'
  | 'CANCELLED';

export type PaymentFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';

export interface Contract {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description?: string | null;
  status: ContractStatus;
  companyId?: string | null;
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  totalValue: number;
  paymentFrequency: PaymentFrequency;
  paymentAmount: number;
  categoryId?: string | null;
  costCenterId?: string | null;
  bankAccountId?: string | null;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalPeriodMonths?: number | null;
  alertDaysBefore: number;
  folderPath?: string | null;
  notes?: string | null;
  isActive: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface CreateContractData {
  title: string;
  description?: string;
  companyId?: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  totalValue: number;
  paymentFrequency: PaymentFrequency;
  paymentAmount: number;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;
  alertDaysBefore?: number;
  notes?: string;
}

export type UpdateContractData = Partial<
  Omit<CreateContractData, 'startDate'>
>;

export interface ContractsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ContractStatus;
  companyName?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface SupplierHistory {
  contracts: Contract[];
  totalContracts: number;
  totalPaymentsValue: number;
  totalPaymentsCount: number;
}

export interface GenerateEntriesResult {
  entriesCreated: number;
  totalEntries: number;
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  RENEWED: 'Renovado',
  CANCELLED: 'Cancelado',
};

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};
