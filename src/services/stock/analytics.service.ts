import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  StockSummary,
  MovementsSummary,
  DashboardData,
} from '@/types/stock';

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  categoryId?: string;
}

function buildQueryString(query?: AnalyticsQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.warehouseId) params.append('warehouseId', query.warehouseId);
  if (query.categoryId) params.append('categoryId', query.categoryId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const stockAnalyticsService = {
  // GET /v1/analytics/stock-summary
  async getStockSummary(query?: AnalyticsQuery): Promise<StockSummary> {
    const url = `${API_ENDPOINTS.STOCK_ANALYTICS.STOCK_SUMMARY}${buildQueryString(query)}`;
    return apiClient.get<StockSummary>(url);
  },

  // GET /v1/analytics/movements-summary
  async getMovementsSummary(query?: AnalyticsQuery): Promise<MovementsSummary> {
    const url = `${API_ENDPOINTS.STOCK_ANALYTICS.MOVEMENTS_SUMMARY}${buildQueryString(query)}`;
    return apiClient.get<MovementsSummary>(url);
  },

  // GET /v1/analytics/abc-curve (future)
  async getABCCurve(query?: AnalyticsQuery): Promise<{
    a: Array<{
      variantId: string;
      name: string;
      value: number;
      percentage: number;
    }>;
    b: Array<{
      variantId: string;
      name: string;
      value: number;
      percentage: number;
    }>;
    c: Array<{
      variantId: string;
      name: string;
      value: number;
      percentage: number;
    }>;
  }> {
    const url = `${API_ENDPOINTS.STOCK_ANALYTICS.ABC_CURVE}${buildQueryString(query)}`;
    return apiClient.get(url);
  },

  // GET /v1/analytics/stock-turnover (future)
  async getStockTurnover(query?: AnalyticsQuery): Promise<{
    overall: number;
    byCategory: Array<{ categoryId: string; name: string; turnover: number }>;
    byProduct: Array<{ productId: string; name: string; turnover: number }>;
  }> {
    const url = `${API_ENDPOINTS.STOCK_ANALYTICS.STOCK_TURNOVER}${buildQueryString(query)}`;
    return apiClient.get(url);
  },

  // GET /v1/dashboard/stock
  async getDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>(
      API_ENDPOINTS.STOCK_ANALYTICS.DASHBOARDS
    );
  },

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  // Get summary for current month
  async getCurrentMonthSummary(): Promise<MovementsSummary> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    return this.getMovementsSummary({ startDate, endDate });
  },

  // Get summary for last 7 days
  async getWeeklySummary(): Promise<MovementsSummary> {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    return this.getMovementsSummary({ startDate, endDate });
  },

  // Get low stock alerts only
  async getLowStockAlerts(): Promise<StockSummary['lowStockAlerts']> {
    const summary = await this.getStockSummary();
    return summary.lowStockAlerts;
  },

  // Get stock value by warehouse
  async getStockValueByWarehouse(): Promise<StockSummary['byWarehouse']> {
    const summary = await this.getStockSummary();
    return summary.byWarehouse;
  },
};
