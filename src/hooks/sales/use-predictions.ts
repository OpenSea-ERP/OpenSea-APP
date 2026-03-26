import { predictionsService } from '@/services/sales';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEYS = {
  DEAL_PREDICTION: (dealId: string) => ['predictions', 'deals', dealId],
} as const;

export function useDealPrediction(dealId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.DEAL_PREDICTION(dealId),
    queryFn: () => predictionsService.getDealPrediction(dealId),
    enabled: !!dealId,
    staleTime: 60_000 * 5, // 5 minutes
  });
}
