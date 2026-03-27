export interface FinanceDashboard {
  totalPayable: number;
  totalReceivable: number;
  overduePayable: number;
  overdueReceivable: number;
  overduePayableCount: number;
  overdueReceivableCount: number;
  paidThisMonth: number;
  receivedThisMonth: number;
  upcomingPayable7Days: number;
  upcomingReceivable7Days: number;
  cashBalance: number;
  topOverdueReceivables: OverdueReceivableSummary[];
  topOverduePayables: OverduePayableSummary[];
}

export interface OverdueReceivableSummary {
  customerName: string;
  totalOverdue: number;
  count: number;
  oldestDueDate: string;
}

export interface OverduePayableSummary {
  supplierName: string;
  totalOverdue: number;
  count: number;
  oldestDueDate: string;
}

export interface FinanceOverviewEntryTypeCounts {
  total: number;
  pending: number;
  overdue: number;
}

export interface FinanceOverviewEntityCounts {
  total: number;
  active: number;
}

export interface FinanceOverview {
  payable: FinanceOverviewEntryTypeCounts;
  receivable: FinanceOverviewEntryTypeCounts;
  loans: FinanceOverviewEntityCounts;
  consortia: FinanceOverviewEntityCounts;
  contracts: FinanceOverviewEntityCounts;
  recurring: FinanceOverviewEntityCounts;
  bankAccounts: number;
  categories: number;
  costCenters: number;
}

// ─── Anomaly Detection ───────────────────────────────────────────────

export type AnomalyType =
  | 'EXPENSE_SPIKE'
  | 'PRICE_INCREASE'
  | 'UNUSUAL_FREQUENCY'
  | 'NEW_HIGH_VALUE';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  entryId?: string;
  categoryName?: string;
  supplierName?: string;
  currentValue: number;
  expectedValue: number;
  deviationPercent: number;
  description: string;
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  analyzedPeriod: { from: string; to: string };
  totalEntriesAnalyzed: number;
  categoriesAnalyzed: number;
}

// ─── Cashflow Accuracy (Realized vs Projected) ──────────────────────

export interface CashflowAccuracyDataPoint {
  date: string;
  predictedInflow: number;
  predictedOutflow: number;
  actualInflow: number | null;
  actualOutflow: number | null;
}

export interface CashflowAccuracyResponse {
  accuracy: number;
  dataPoints: CashflowAccuracyDataPoint[];
  periodCount: number;
}

// ─── Financial Health Score ──────────────────────────────────────────

export type HealthTrend = 'UP' | 'DOWN' | 'STABLE';

export interface HealthDimension {
  name: string;
  score: number;
  maxScore: number;
  details: string;
}

export interface FinancialHealthScore {
  score: number;
  dimensions: HealthDimension[];
  tips: string[];
  trend: HealthTrend;
}

// ─── Cashflow ────────────────────────────────────────────────────────

export interface CashflowData {
  period: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeBalance: number;
}

export interface CashflowResponse {
  data: CashflowData[];
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
    openingBalance: number;
    closingBalance: number;
  };
}
