import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * PIN-gated. Reativa webhook AUTO_DISABLED → ACTIVE.
 * Próximas falhas voltam a contar para auto-disable (10 DEAD consecutivas D-25).
 */
export function useReactivateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      actionPinToken,
    }: {
      id: string;
      actionPinToken: string;
    }) => webhooksService.reactivate(id, actionPinToken),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.all,
      });
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.detail(variables.id),
      });
      toast.success('Webhook reativado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao reativar webhook. Verifique o PIN.');
    },
  });
}
