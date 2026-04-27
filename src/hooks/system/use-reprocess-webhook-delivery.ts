import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * Reenvia uma entrega individual (D-20). Backend valida cooldown 30s + max 3
 * (D-21). UI mostra o cooldown localmente — backend é a fonte de verdade.
 */
export function useReprocessWebhookDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      webhookId,
      deliveryId,
    }: {
      webhookId: string;
      deliveryId: string;
    }) => webhooksService.reprocessDelivery(webhookId, deliveryId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.deliveries(variables.webhookId),
      });
      toast.success('Reenvio enfileirado. Aguarde a próxima sincronização.');
    },
    onError: () => {
      toast.error(
        'Não foi possível reenviar a entrega. Verifique o cooldown ou o limite de 3 reenvios.'
      );
    },
  });
}
