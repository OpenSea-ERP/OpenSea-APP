import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { LedgerResponse, TrialBalanceResponse } from '@/types/finance';

export interface DRENode {
  categoryId: string;
  categoryName: string;
  level: number;
  currentPeriod: number;
  previousPeriod: number;
  variationPercent: number;
  children: DRENode[];
}

export interface InteractiveDREResponse {
  revenue: DRENode;
  expenses: DRENode;
  netResult: number;
  previousNetResult: number;
  variationPercent: number;
  period: { start: string; end: string };
  previousPeriod: { start: string; end: string };
}

export interface ConsolidatedDRENode {
  categoryId: string;
  categoryName: string;
  level: number;
  amount: number;
  children: ConsolidatedDRENode[];
}

export interface CompanyDRESummary {
  companyId: string;
  companyName: string;
  revenue: number;
  expenses: number;
  netResult: number;
  revenueTree: ConsolidatedDRENode;
  expenseTree: ConsolidatedDRENode;
}

export interface ConsolidatedDREResponse {
  companies: CompanyDRESummary[];
  consolidated: {
    revenue: number;
    expenses: number;
    netResult: number;
    revenueTree: ConsolidatedDRENode;
    expenseTree: ConsolidatedDRENode;
  };
  period: { start: string; end: string };
}

export type ExportFormat = 'CSV' | 'PDF' | 'XLSX' | 'DOCX';
export type ReportType = 'ENTRIES' | 'DRE' | 'BALANCE' | 'CASHFLOW';

export const financeReportsService = {
  async getLedger(params: {
    chartOfAccountId: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<LedgerResponse> {
    const query = new URLSearchParams();
    if (params.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params.dateTo) query.append('dateTo', params.dateTo);
    return apiClient.get<LedgerResponse>(
      `${API_ENDPOINTS.FINANCE_REPORTS.LEDGER}/${params.chartOfAccountId}?${query.toString()}`
    );
  },

  async getTrialBalance(params: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TrialBalanceResponse> {
    const query = new URLSearchParams();
    if (params.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params.dateTo) query.append('dateTo', params.dateTo);
    return apiClient.get<TrialBalanceResponse>(
      `${API_ENDPOINTS.FINANCE_REPORTS.TRIAL_BALANCE}?${query.toString()}`
    );
  },

  async getAnnualDRE(year: number): Promise<{
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
  }> {
    const query = new URLSearchParams({ year: String(year) });
    return apiClient.get(`/v1/finance/reports/dre?${query.toString()}`);
  },

  async getInteractiveDRE(params: {
    startDate: string;
    endDate: string;
    categoryId?: string;
  }): Promise<InteractiveDREResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });
    if (params.categoryId) query.append('categoryId', params.categoryId);

    return apiClient.get<InteractiveDREResponse>(
      `/v1/finance/dashboard/dre?${query.toString()}`
    );
  },

  async exportReport(params: {
    reportType: ReportType;
    format: ExportFormat;
    startDate: string;
    endDate: string;
    type?: string;
  }): Promise<Blob> {
    const baseUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3333'
        : 'http://127.0.0.1:3333';

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const response = await fetch(
      `${baseUrl}${API_ENDPOINTS.FINANCE_DASHBOARD.EXPORT_ACCOUNTING}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reportType: params.reportType,
          format: params.format,
          startDate: params.startDate,
          endDate: params.endDate,
          type: params.type,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao exportar relatorio: ${response.statusText}`);
    }

    return response.blob();
  },

  async getConsolidatedDRE(params: {
    startDate: string;
    endDate: string;
    companyIds?: string[];
  }): Promise<ConsolidatedDREResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });
    if (params.companyIds && params.companyIds.length > 0) {
      query.append('companyIds', params.companyIds.join(','));
    }

    return apiClient.get<ConsolidatedDREResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.DRE_CONSOLIDATED}?${query.toString()}`
    );
  },

  async exportSpedEfd(params: {
    year: number;
    month: number;
    companyId?: string;
  }): Promise<Blob> {
    const baseUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3333'
        : 'http://127.0.0.1:3333';

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const query = new URLSearchParams({
      year: String(params.year),
      month: String(params.month),
    });
    if (params.companyId) query.append('companyId', params.companyId);

    const response = await fetch(
      `${baseUrl}${API_ENDPOINTS.FINANCE_DASHBOARD.EXPORT_SPED_EFD}?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao exportar SPED EFD: ${response.statusText}`);
    }

    return response.blob();
  },
};
