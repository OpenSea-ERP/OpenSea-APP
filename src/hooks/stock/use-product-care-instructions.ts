import { apiClient } from '@/lib/api-client';
import type {
  ProductCareInstruction,
  CreateProductCareInstructionRequest,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para listar instruções de cuidado de um produto
 */
export function useProductCareInstructions(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'care-instructions'],
    queryFn: async () => {
      const response = await apiClient.get<{
        careInstructions: ProductCareInstruction[];
      }>(`/v1/products/${productId}/care-instructions`);
      return response.careInstructions;
    },
    enabled: !!productId,
  });
}

/**
 * Hook para adicionar instrução de cuidado a um produto
 */
export function useAddProductCareInstruction(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductCareInstructionRequest) => {
      return apiClient.post<ProductCareInstruction>(
        `/v1/products/${productId}/care-instructions`,
        data
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products', productId, 'care-instructions'],
      });
    },
  });
}

/**
 * Hook para remover instrução de cuidado de um produto
 */
export function useDeleteProductCareInstruction(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (careInstructionId: string) => {
      return apiClient.delete(
        `/v1/products/${productId}/care-instructions/${careInstructionId}`
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products', productId, 'care-instructions'],
      });
    },
  });
}
