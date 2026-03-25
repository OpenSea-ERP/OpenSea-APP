import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BudgetConfigResponse,
  BudgetReportResponse,
  SaveBudgetRequest,
} from '@/types/finance';

export const budgetService = {
  async getReport(params: {
    year: number;
    month?: number;
  }): Promise<BudgetReportResponse> {
    const query = new URLSearchParams({
      year: String(params.year),
    });
    if (params.month) query.append('month', String(params.month));

    return apiClient.get<BudgetReportResponse>(
      `${API_ENDPOINTS.FINANCE_BUDGET.REPORT}?${query.toString()}`
    );
  },

  async getConfig(year: number): Promise<BudgetConfigResponse> {
    return apiClient.get<BudgetConfigResponse>(
      `${API_ENDPOINTS.FINANCE_BUDGET.CONFIG}?year=${year}`
    );
  },

  async save(data: SaveBudgetRequest): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.FINANCE_BUDGET.SAVE,
      data
    );
  },
};
