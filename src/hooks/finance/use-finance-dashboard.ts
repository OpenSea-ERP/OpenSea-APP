import { financeDashboardService } from '@/services/finance';
import type { ForecastQuery } from '@/types/finance';
import { useMutation, useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  DASHBOARD: ['finance-dashboard'],
  FORECAST: ['finance-forecast'],
  CASHFLOW: ['finance-cashflow'],
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
