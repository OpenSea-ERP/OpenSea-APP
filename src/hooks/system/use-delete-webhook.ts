import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * PIN-gated. Receives `actionPin` and forwards via X-Action-Pin header.
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionPin }: { id: string; actionPin: string }) =>
      webhooksService.delete(id, actionPin),
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
