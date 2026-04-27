import { useQuery } from '@tanstack/react-query';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

export function useWebhook(id: string | undefined) {
  return useQuery({
    queryKey: WEBHOOKS_QUERY_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Webhook id is required');
      const response = await webhooksService.get(id);
      return response.endpoint;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
