export interface CostCenter {
  id: string;
  companyId?: string | null;
  companyName?: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  monthlyBudget?: number | null;
  annualBudget?: number | null;
  parentId?: string | null;
  parentName?: string;
  childrenCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCostCenterData {
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  monthlyBudget?: number;
  annualBudget?: number;
  parentId?: string;
}

export type UpdateCostCenterData = Partial<CreateCostCenterData>;

export interface CostCentersQuery {
  page?: number;
  perPage?: number;
  search?: string;
  companyId?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'code' | 'createdAt' | 'monthlyBudget' | 'annualBudget';
  sortOrder?: 'asc' | 'desc';
}
