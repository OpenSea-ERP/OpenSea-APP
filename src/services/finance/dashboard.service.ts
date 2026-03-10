import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  FinanceDashboard,
  CashflowResponse,
  ForecastQuery,
  ForecastResponse,
} from '@/types/finance';

export const financeDashboardService = {
  async getDashboard(): Promise<FinanceDashboard> {
    return apiClient.get<FinanceDashboard>(
      API_ENDPOINTS.FINANCE_DASHBOARD.OVERVIEW
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
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

    const response = await fetch(
      `${baseUrl}${API_ENDPOINTS.FINANCE_DASHBOARD.EXPORT_ACCOUNTING}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao exportar: ${response.statusText}`);
    }

    return response.blob();
  },
};
