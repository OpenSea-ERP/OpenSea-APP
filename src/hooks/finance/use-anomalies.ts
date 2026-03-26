import { financeAnalyticsService } from '@/services/finance/finance-analytics.service';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  ANOMALIES: ['finance-anomalies'],
} as const;

export function useAnomalyReport(months = 6) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ANOMALIES, months],
    queryFn: () => financeAnalyticsService.getAnomalies(months),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
