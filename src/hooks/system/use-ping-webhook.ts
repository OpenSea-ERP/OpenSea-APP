import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * Envia evento sintético `webhook.ping` (D-14). Adiciona uma linha PING ao log
 * que pode ser inspecionada normalmente. Não tem PIN gate — admin-only via RBAC.
 */
export function usePingWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webhooksService.ping(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.deliveries(id),
      });
      toast.success('Ping enviado. Verifique o log em alguns segundos.');
    },
    onError: () => {
      toast.error('Erro ao enviar ping. Verifique a URL do webhook.');
    },
  });
}
