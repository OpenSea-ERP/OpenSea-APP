import { apiClient } from '@/lib/api-client';
import type { Attachment, CreateAttachmentRequest } from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para listar anexos de uma variante
 */
export function useVariantAttachments(variantId: string) {
  return useQuery({
    queryKey: ['variants', variantId, 'attachments'],
    queryFn: async () => {
      const response = await apiClient.get<{ attachments: Attachment[] }>(
        `/v1/variants/${variantId}/attachments`
      );
      return response.attachments;
    },
    enabled: !!variantId,
  });
}

/**
 * Hook para adicionar anexo a uma variante
 */
export function useAddVariantAttachment(variantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAttachmentRequest) => {
      return apiClient.post<Attachment>(
        `/v1/variants/${variantId}/attachments`,
        data
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['variants', variantId, 'attachments'],
      });
    },
  });
}

/**
 * Hook para remover anexo de uma variante
 */
export function useDeleteVariantAttachment(variantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      return apiClient.delete(
        `/v1/variants/${variantId}/attachments/${attachmentId}`
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['variants', variantId, 'attachments'],
      });
    },
  });
}
