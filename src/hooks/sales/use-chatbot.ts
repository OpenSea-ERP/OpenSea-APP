import { chatbotService } from '@/services/sales';
import type { UpdateChatbotConfigRequest } from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CHATBOT_CONFIG: ['chatbot-config'],
} as const;

export function useChatbotConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.CHATBOT_CONFIG,
    queryFn: () => chatbotService.getConfig(),
    staleTime: 30_000,
  });
}

export function useUpdateChatbotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChatbotConfigRequest) =>
      chatbotService.updateConfig(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHATBOT_CONFIG,
      });
    },
  });
}
