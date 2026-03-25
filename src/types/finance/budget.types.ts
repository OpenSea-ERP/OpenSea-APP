// ============================================================================
// Budget vs Actual Types
// ============================================================================

export type BudgetStatus = 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';

export interface BudgetItem {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  year: number;
  month: number;
  amount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface BudgetReportRow {
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  budgeted: number;
  actual: number;
  variationAmount: number;
  variationPercent: number;
  status: BudgetStatus;
  children?: BudgetReportRow[];
}

export interface BudgetReportResponse {
  rows: BudgetReportRow[];
  totals: {
    budgeted: number;
    actual: number;
    variationAmount: number;
    variationPercent: number;
    status: BudgetStatus;
  };
  year: number;
  month: number | null;
}

export interface BudgetConfigEntry {
  categoryId: string;
  categoryName: string;
  months: Record<number, number>; // 1-12 → amount
}

export interface SaveBudgetRequest {
  year: number;
  items: {
    categoryId: string;
    month: number;
    amount: number;
  }[];
}

export interface BudgetConfigResponse {
  items: BudgetItem[];
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  UNDER_BUDGET: 'Abaixo',
  ON_BUDGET: 'No Limite',
  OVER_BUDGET: 'Acima',
};

export const BUDGET_STATUS_COLORS: Record<
  BudgetStatus,
  { bg: string; text: string; border: string }
> = {
  UNDER_BUDGET: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  ON_BUDGET: {
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  OVER_BUDGET: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
};
