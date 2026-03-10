import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { FinanceDashboard } from '@/types/finance';

export interface OverdueSummary {
  markedOverdue: number;
}

export interface DailySummary {
  payableToday: number;
  receivableToday: number;
  overdueCount: number;
  overdueTotal: number;
}

export const financeNotificationsService = {
  async getOverdueSummary(): Promise<OverdueSummary> {
    return apiClient.post<OverdueSummary>(
      API_ENDPOINTS.FINANCE_DASHBOARD.CHECK_OVERDUE,
      {}
    );
  },

  async getDashboard(): Promise<{ dashboard: FinanceDashboard }> {
    return apiClient.get<{ dashboard: FinanceDashboard }>(
      API_ENDPOINTS.FINANCE_DASHBOARD.OVERVIEW
    );
  },
};
