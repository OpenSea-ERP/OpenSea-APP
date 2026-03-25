import { customerScoreService } from '@/services/finance';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  CUSTOMER_SCORE: (name: string) => ['customer-score', name],
} as const;

export { QUERY_KEYS as customerScoreKeys };

export function useCustomerScore(customerName: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER_SCORE(customerName),
    queryFn: () => customerScoreService.getScore(customerName),
    enabled: !!customerName && customerName.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
