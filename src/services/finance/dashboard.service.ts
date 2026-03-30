import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  FinanceDashboard,
  FinanceOverview,
  CashflowResponse,
  CashflowAccuracyResponse,
  FinancialHealthScore,
  ForecastQuery,
  ForecastResponse,
  PredictiveCashflowReport,
  BalanceSheetResponse,
  QuickAction,
  CashflowAlert,
  CategorySuggestion,
  RecurringDatePreview,
} from '@/types/finance';

export const financeDashboardService = {
  async getDashboard(): Promise<FinanceDashboard> {
    return apiClient.get<FinanceDashboard>(
      API_ENDPOINTS.FINANCE_DASHBOARD.OVERVIEW
    );
  },

  async getOverview(): Promise<FinanceOverview> {
    return apiClient.get<FinanceOverview>(
      API_ENDPOINTS.FINANCE_DASHBOARD.LANDING_OVERVIEW
    );
  },

  async getForecast(params: ForecastQuery): Promise<ForecastResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy,
    });

    if (params.type) query.append('type', params.type);
    if (params.costCenterId) query.append('costCenterId', params.costCenterId);
    if (params.categoryId) query.append('categoryId', params.categoryId);

    return apiClient.get<ForecastResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.FORECAST}?${query.toString()}`
    );
  },

  async getCashflow(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
    bankAccountId?: string;
  }): Promise<CashflowResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });

    if (params.groupBy) query.append('groupBy', params.groupBy);
    if (params.bankAccountId)
      query.append('bankAccountId', params.bankAccountId);

    return apiClient.get<CashflowResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.CASHFLOW}?${query.toString()}`
    );
  },

  async getPredictiveCashflow(
    months: number = 3
  ): Promise<PredictiveCashflowReport> {
    const query = new URLSearchParams({ months: String(months) });
    return apiClient.get<PredictiveCashflowReport>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.PREDICTIVE_CASHFLOW}?${query.toString()}`
    );
  },

  async getCashflowAccuracy(params: {
    startDate: string;
    endDate: string;
  }): Promise<CashflowAccuracyResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });

    return apiClient.get<CashflowAccuracyResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.CASHFLOW_ACCURACY}?${query.toString()}`
    );
  },

  async getHealthScore(): Promise<FinancialHealthScore> {
    return apiClient.get<FinancialHealthScore>(
      API_ENDPOINTS.FINANCE_DASHBOARD.HEALTH_SCORE
    );
  },

  async exportAccounting(params: {
    reportType: 'ENTRIES' | 'DRE' | 'BALANCE' | 'CASHFLOW';
    format: 'CSV' | 'PDF' | 'XLSX' | 'DOCX';
    startDate: string;
    endDate: string;
    type?: string;
    costCenterId?: string;
    categoryId?: string;
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
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao exportar: ${response.statusText}`);
    }

    return response.blob();
  },

  async getBalanceSheet(params: {
    startDate: string;
    endDate: string;
  }): Promise<BalanceSheetResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });
    return apiClient.get<BalanceSheetResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.BALANCE_SHEET}?${query.toString()}`
    );
  },

  async getQuickActions(): Promise<{ actions: QuickAction[] }> {
    return apiClient.get<{ actions: QuickAction[] }>(
      API_ENDPOINTS.FINANCE_DASHBOARD.QUICK_ACTIONS
    );
  },

  async getCashflowAlerts(): Promise<{ alerts: CashflowAlert[] }> {
    return apiClient.get<{ alerts: CashflowAlert[] }>(
      API_ENDPOINTS.FINANCE_DASHBOARD.CASHFLOW_ALERTS
    );
  },

  async suggestCategory(
    supplierName: string,
    description?: string
  ): Promise<{ suggestions: CategorySuggestion[] }> {
    const query = new URLSearchParams({ supplierName });
    if (description) query.append('description', description);
    return apiClient.get<{ suggestions: CategorySuggestion[] }>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.SUGGEST_CATEGORY}?${query.toString()}`
    );
  },

  async previewRecurringDates(params: {
    startDate: string;
    frequency: string;
    interval?: number;
    count?: number;
    adjustBusinessDays?: boolean;
  }): Promise<RecurringDatePreview> {
    return apiClient.post<RecurringDatePreview>(
      API_ENDPOINTS.FINANCE_DASHBOARD.RECURRING_PREVIEW_DATES,
      params
    );
  },
};
