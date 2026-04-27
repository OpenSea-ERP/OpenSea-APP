import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

/**
 * PIN-gated. Returns `{ endpoint, secret }` where `secret` is the new cleartext
 * secret — UI must show it ONCE on a reveal screen (never persist).
 * Old secret stays valid for 7 days (D-07 rotação suave).
 */
export function useRegenerateWebhookSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionPin }: { id: string; actionPin: string }) =>
      webhooksService.regenerateSecret(id, actionPin),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.detail(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.all,
      });
      toast.success('Secret regenerado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao regenerar secret. Verifique o PIN.');
    },
  });
}
