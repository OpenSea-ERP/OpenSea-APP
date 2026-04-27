import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * PIN-gated. Receives `actionPinToken` (JWT scope=action-pin emitido após
 * VerifyActionPinModal) e envia via header `x-action-pin-token`.
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      actionPinToken,
    }: {
      id: string;
      actionPinToken: string;
    }) => webhooksService.delete(id, actionPinToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.all,
      });
      toast.success('Webhook excluído com sucesso.');
    },
    onError: () => {
      toast.error(
        'Erro ao excluir webhook. Verifique o PIN e tente novamente.'
      );
    },
  });
}
