// =============================================================================
// Chart of Account Types
// =============================================================================

export type ChartOfAccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

export type ChartOfAccountClass =
  | 'CURRENT'
  | 'NON_CURRENT'
  | 'OPERATIONAL'
  | 'FINANCIAL'
  | 'OTHER';

export type ChartOfAccountNature = 'DEBIT' | 'CREDIT';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: ChartOfAccountType;
  accountClass: ChartOfAccountClass;
  nature: ChartOfAccountNature;
  parentId?: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateChartOfAccountData {
  code: string;
  name: string;
  type: ChartOfAccountType;
  accountClass: ChartOfAccountClass;
  nature: ChartOfAccountNature;
  parentId?: string;
  isActive?: boolean;
}

export type UpdateChartOfAccountData = Partial<
  Omit<CreateChartOfAccountData, 'isSystem'>
>;

export interface ChartOfAccountsQuery {
  page?: number;
  perPage?: number;
  search?: string;
  type?: ChartOfAccountType;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
