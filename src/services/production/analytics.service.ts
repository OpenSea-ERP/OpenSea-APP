import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { ProductionDashboardData } from '@/types/production';

export const analyticsService = {
  async getDashboard(): Promise<ProductionDashboardData> {
    return apiClient.get<ProductionDashboardData>(
      API_ENDPOINTS.PRODUCTION.ANALYTICS.DASHBOARD,
    );
  },
};
