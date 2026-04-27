import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import type { UpdateWebhookRequest } from '@/types/system';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookRequest }) =>
      webhooksService.update(id, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.all,
      });
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.detail(variables.id),
      });
      toast.success('Webhook atualizado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao atualizar webhook.');
    },
  });
}
