import { apiClient } from '@/lib/api-client';
import type { Attachment, CreateAttachmentRequest } from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para listar anexos de um produto
 */
export function useProductAttachments(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'attachments'],
    queryFn: async () => {
      const response = await apiClient.get<{ attachments: Attachment[] }>(
        `/v1/products/${productId}/attachments`
      );
      return response.attachments;
    },
    enabled: !!productId,
  });
}

/**
 * Hook para adicionar anexo a um produto
 */
export function useAddProductAttachment(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAttachmentRequest) => {
      return apiClient.post<Attachment>(
        `/v1/products/${productId}/attachments`,
        data
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products', productId, 'attachments'],
      });
    },
  });
}

/**
 * Hook para remover anexo de um produto
 */
export function useDeleteProductAttachment(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      return apiClient.delete(
        `/v1/products/${productId}/attachments/${attachmentId}`
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products', productId, 'attachments'],
      });
    },
  });
}
