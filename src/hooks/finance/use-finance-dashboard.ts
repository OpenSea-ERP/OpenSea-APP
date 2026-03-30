import { financeDashboardService } from '@/services/finance';
import type { ForecastQuery } from '@/types/finance';
import { useMutation, useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  DASHBOARD: ['finance-dashboard'],
  FORECAST: ['finance-forecast'],
  CASHFLOW: ['finance-cashflow'],
  PREDICTIVE_CASHFLOW: ['finance-predictive-cashflow'],
  CASHFLOW_ACCURACY: ['finance-cashflow-accuracy'],
  HEALTH_SCORE: ['finance-health-score'],
  BALANCE_SHEET: ['finance-balance-sheet'],
  QUICK_ACTIONS: ['finance-quick-actions'],
  CASHFLOW_ALERTS: ['finance-cashflow-alerts'],
  CATEGORY_SUGGESTION: ['finance-category-suggestion'],
  RECURRING_PREVIEW: ['finance-recurring-preview'],
} as const;

export function useFinanceDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: () => financeDashboardService.getDashboard(),
  });
}

export function useFinanceForecast(params: ForecastQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.FORECAST, params],
    queryFn: () => financeDashboardService.getForecast(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useFinanceCashflow(params: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  bankAccountId?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CASHFLOW, params],
    queryFn: () => financeDashboardService.getCashflow(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function usePredictiveCashflow(months: number = 3) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PREDICTIVE_CASHFLOW, months],
    queryFn: () => financeDashboardService.getPredictiveCashflow(months),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCashflowAccuracy(params: {
  startDate: string;
  endDate: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.CASHFLOW_ACCURACY,
      params.startDate,
      params.endDate,
    ],
    queryFn: () =>
      financeDashboardService.getCashflowAccuracy({
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    enabled: (params.enabled ?? true) && !!params.startDate && !!params.endDate,
    staleTime: 60 * 1000,
  });
}

export function useFinancialHealthScore() {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_SCORE,
    queryFn: () => financeDashboardService.getHealthScore(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBalanceSheet(params: {
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BALANCE_SHEET, params],
    queryFn: () => financeDashboardService.getBalanceSheet(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useQuickActions() {
  return useQuery({
    queryKey: QUERY_KEYS.QUICK_ACTIONS,
    queryFn: () => financeDashboardService.getQuickActions(),
    staleTime: 60 * 1000,
  });
}

export function useCashflowAlerts() {
  return useQuery({
    queryKey: QUERY_KEYS.CASHFLOW_ALERTS,
    queryFn: () => financeDashboardService.getCashflowAlerts(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategorySuggestion(
  supplierName: string,
  description?: string
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CATEGORY_SUGGESTION, supplierName, description],
    queryFn: () =>
      financeDashboardService.suggestCategory(supplierName, description),
    enabled: !!supplierName && supplierName.length >= 3,
    staleTime: 30_000,
  });
}

export function useRecurringPreview(params: {
  startDate: string;
  frequency: string;
  interval?: number;
  count?: number;
  adjustBusinessDays?: boolean;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RECURRING_PREVIEW, params],
    queryFn: () => financeDashboardService.previewRecurringDates(params),
    enabled: !!params.startDate && !!params.frequency,
    staleTime: 30_000,
  });
}

export function useExportAccounting() {
  return useMutation({
    mutationFn: (params: {
      reportType: 'ENTRIES' | 'DRE' | 'BALANCE' | 'CASHFLOW';
      format: 'CSV' | 'PDF' | 'XLSX' | 'DOCX';
      startDate: string;
      endDate: string;
      type?: string;
      costCenterId?: string;
      categoryId?: string;
    }) => financeDashboardService.exportAccounting(params),
  });
}
