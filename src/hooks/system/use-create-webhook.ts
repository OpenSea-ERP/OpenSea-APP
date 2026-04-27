import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhooksService } from '@/services/system/webhooks-service';
import type { CreateWebhookRequest } from '@/types/system';
import { WEBHOOKS_QUERY_KEYS } from './use-webhooks';

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => webhooksService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOKS_QUERY_KEYS.all,
      });
      toast.success('Webhook criado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao criar webhook. Verifique a URL e tente novamente.');
    },
  });
}
