import { stockAnalyticsService } from '@/services/stock';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  categoryId?: string;
}

export const ANALYTICS_QUERY_KEYS = {
  STOCK_SUMMARY: ['analytics', 'stock-summary'],
  MOVEMENTS_SUMMARY: ['analytics', 'movements-summary'],
  ABC_CURVE: ['analytics', 'abc-curve'],
  STOCK_TURNOVER: ['analytics', 'stock-turnover'],
  DASHBOARD: ['analytics', 'dashboard'],
  WEEKLY_SUMMARY: ['analytics', 'weekly-summary'],
  MONTHLY_SUMMARY: ['analytics', 'monthly-summary'],
  LOW_STOCK_ALERTS: ['analytics', 'low-stock-alerts'],
} as const;

// GET /v1/analytics/stock-summary - Resumo do estoque
export function useStockSummary(query?: AnalyticsQuery) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.STOCK_SUMMARY, query],
    queryFn: () => stockAnalyticsService.getStockSummary(query),
    staleTime: 60000, // Cache for 1 minute
  });
}

// GET /v1/analytics/movements-summary - Resumo de movimentações
export function useMovementsSummary(query?: AnalyticsQuery) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.MOVEMENTS_SUMMARY, query],
    queryFn: () => stockAnalyticsService.getMovementsSummary(query),
    staleTime: 60000,
  });
}

// GET /v1/analytics/abc-curve - Curva ABC
export function useABCCurve(query?: AnalyticsQuery) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.ABC_CURVE, query],
    queryFn: () => stockAnalyticsService.getABCCurve(query),
    staleTime: 300000, // Cache for 5 minutes (expensive query)
  });
}

// GET /v1/analytics/stock-turnover - Giro de estoque
export function useStockTurnover(query?: AnalyticsQuery) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.STOCK_TURNOVER, query],
    queryFn: () => stockAnalyticsService.getStockTurnover(query),
    staleTime: 300000,
  });
}

// GET /v1/dashboard/stock - Dashboard completo
export function useStockDashboard() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.DASHBOARD,
    queryFn: () => stockAnalyticsService.getDashboard(),
    staleTime: 60000,
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

// Get weekly summary
export function useWeeklySummary() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.WEEKLY_SUMMARY,
    queryFn: () => stockAnalyticsService.getWeeklySummary(),
    staleTime: 60000,
  });
}

// Get current month summary
export function useCurrentMonthSummary() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.MONTHLY_SUMMARY,
    queryFn: () => stockAnalyticsService.getCurrentMonthSummary(),
    staleTime: 60000,
  });
}

// Get low stock alerts only
export function useLowStockAlerts() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.LOW_STOCK_ALERTS,
    queryFn: () => stockAnalyticsService.getLowStockAlerts(),
    staleTime: 60000,
    refetchInterval: 600000, // Auto-refresh every 10 minutes
  });
}

// Get stock value by warehouse
export function useStockValueByWarehouse() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEYS.STOCK_SUMMARY, 'by-warehouse'],
    queryFn: () => stockAnalyticsService.getStockValueByWarehouse(),
    staleTime: 60000,
  });
}

// ============================================
// COMBINED DASHBOARD DATA HOOK
// ============================================

export function useDashboardData() {
  const dashboard = useStockDashboard();
  const lowStockAlerts = useLowStockAlerts();
  const weeklySummary = useWeeklySummary();

  return {
    dashboard: dashboard.data,
    lowStockAlerts: lowStockAlerts.data,
    weeklySummary: weeklySummary.data,
    isLoading:
      dashboard.isLoading ||
      lowStockAlerts.isLoading ||
      weeklySummary.isLoading,
    isError:
      dashboard.isError || lowStockAlerts.isError || weeklySummary.isError,
    error: dashboard.error || lowStockAlerts.error || weeklySummary.error,
    refetch: () => {
      dashboard.refetch();
      lowStockAlerts.refetch();
      weeklySummary.refetch();
    },
  };
}
