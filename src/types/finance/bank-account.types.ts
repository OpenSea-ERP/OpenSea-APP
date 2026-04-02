export type BankAccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'SALARY'
  | 'PAYMENT'
  | 'INVESTMENT'
  | 'DIGITAL'
  | 'OTHER';
export type BankAccountStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';
export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export interface BankAccount {
  id: string;
  companyId?: string | null;
  companyName?: string;
  name: string;
  bankCode: string;
  bankName?: string | null;
  agency: string;
  agencyDigit?: string | null;
  accountNumber: string;
  accountDigit?: string | null;
  accountType: BankAccountType;
  status: BankAccountStatus;
  pixKeyType?: PixKeyType | null;
  pixKey?: string | null;
  currentBalance: number;
  balanceUpdatedAt?: string | null;
  color?: string | null;
  isDefault: boolean;
  // API Integration
  apiProvider?: string | null;
  apiClientId?: string | null;
  apiScopes?: string | null;
  apiEnabled?: boolean;
  apiCertificatePath?: string | null;
  apiKeyPath?: string | null;
  apiCertFileId?: string | null;
  apiCertKeyFileId?: string | null;
  autoEmitBoleto?: boolean;
  autoLowThreshold?: number | null;
  apiWebhookSecret?: string | null;
  apiLastSyncAt?: string | null;
  chartOfAccountId?: string | null;
  chartOfAccountCode?: string;
  chartOfAccountName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BankApiConfigData {
  apiProvider?: string;
  apiClientId?: string;
  apiCertFileId?: string;
  apiCertKeyFileId?: string;
  apiScopes?: string;
  apiEnabled?: boolean;
  autoEmitBoleto?: boolean;
  autoLowThreshold?: number;
  apiWebhookSecret?: string;
}

export interface CreateBankAccountData {
  companyId?: string;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: BankAccountType;
  pixKeyType?: PixKeyType;
  pixKey?: string;
  color?: string;
  isDefault?: boolean;
  chartOfAccountId?: string | null;
}

export type UpdateBankAccountData = Partial<
  Omit<CreateBankAccountData, 'companyId'>
>;

export interface BankAccountsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  companyId?: string;
  accountType?: BankAccountType;
  status?: BankAccountStatus;
  sortBy?: 'name' | 'bankName' | 'currentBalance' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const BANK_ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  SALARY: 'Conta Salário',
  PAYMENT: 'Conta Pagamento',
  INVESTMENT: 'Investimento',
  DIGITAL: 'Conta Digital',
  OTHER: 'Outro',
};

export const BANK_ACCOUNT_STATUS_LABELS: Record<BankAccountStatus, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  CLOSED: 'Encerrada',
};

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  RANDOM: 'Chave Aleatória',
};
