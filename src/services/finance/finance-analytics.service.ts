import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  FinanceDashboard,
  CashflowResponse,
  ForecastResponse,
} from '@/types/finance';

export const financeAnalyticsService = {
  async getDashboard(): Promise<FinanceDashboard> {
    return apiClient.get<FinanceDashboard>(
      API_ENDPOINTS.FINANCE_DASHBOARD.OVERVIEW,
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
      `${API_ENDPOINTS.FINANCE_DASHBOARD.CASHFLOW}?${query.toString()}`,
    );
  },

  async getForecast(params: {
    startDate: string;
    endDate: string;
    groupBy: 'day' | 'week' | 'month';
    type?: string;
  }): Promise<ForecastResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy,
    });
    if (params.type) query.append('type', params.type);

    return apiClient.get<ForecastResponse>(
      `${API_ENDPOINTS.FINANCE_DASHBOARD.FORECAST}?${query.toString()}`,
    );
  },
};
