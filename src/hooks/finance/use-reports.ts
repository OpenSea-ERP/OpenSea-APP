import {
  financeReportsService,
  type ExportFormat,
  type ReportType,
} from '@/services/finance/finance-reports.service';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { LedgerResponse, TrialBalanceResponse } from '@/types/finance';
import { toast } from 'sonner';

const QUERY_KEYS = {
  DRE: ['finance-dre-interactive'],
  DRE_CONSOLIDATED: ['finance-dre-consolidated'],
  DRE_ANNUAL: ['finance-dre-annual'],
  LEDGER: ['finance-ledger'],
  TRIAL_BALANCE: ['finance-trial-balance'],
} as const;

export interface DreAnnualResponse {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  netMargin: number;
  monthly: Array<{
    month: number;
    revenue: number;
    expenses: number;
    result: number;
  }>;
}

export function useDreAnnual(year: number) {
  return useQuery<DreAnnualResponse>({
    queryKey: [...QUERY_KEYS.DRE_ANNUAL, year],
    queryFn: () => financeReportsService.getAnnualDRE(year),
    enabled: !!year,
  });
}

export function useLedger(params: {
  chartOfAccountId: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery<LedgerResponse>({
    queryKey: [...QUERY_KEYS.LEDGER, params],
    queryFn: () => financeReportsService.getLedger(params),
    enabled: !!params.chartOfAccountId,
  });
}

export function useTrialBalance(params: {
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery<TrialBalanceResponse>({
    queryKey: [...QUERY_KEYS.TRIAL_BALANCE, params],
    queryFn: () => financeReportsService.getTrialBalance(params),
    enabled: !!params.dateFrom && !!params.dateTo,
  });
}

export function useInteractiveDRE(params: {
  startDate: string;
  endDate: string;
  categoryId?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DRE, params],
    queryFn: () => financeReportsService.getInteractiveDRE(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useConsolidatedDRE(params: {
  startDate: string;
  endDate: string;
  companyIds?: string[];
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DRE_CONSOLIDATED, params],
    queryFn: () => financeReportsService.getConsolidatedDRE(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async (params: {
      reportType: ReportType;
      format: ExportFormat;
      startDate: string;
      endDate: string;
    }) => {
      const blob = await financeReportsService.exportReport(params);
      const ext = params.format.toLowerCase();
      const fileName = `relatorio_${params.reportType.toLowerCase()}.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Relatório exportado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao exportar relatório');
    },
  });
}

export function useExportSpedEfd() {
  return useMutation({
    mutationFn: async (params: {
      year: number;
      month: number;
      companyId?: string;
    }) => {
      const blob = await financeReportsService.exportSpedEfd(params);
      const fileName = `SPED_EFD_${params.year}_${String(params.month).padStart(2, '0')}.txt`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('SPED EFD-Contribuições exportado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao exportar SPED EFD-Contribuições');
    },
  });
}
