import { apiClient } from '@/lib/api-client';
import type { ProductCareInstruction } from '@/types/stock';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para sincronizar as instruções de cuidado de um produto.
 * Compara o estado atual com o desejado e faz create/delete das diferenças.
 */
export function useProductCare(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (careInstructionIds: string[]) => {
      // 1. Buscar instruções atuais
      const response = await apiClient.get<{
        productCareInstructions: ProductCareInstruction[];
      }>(`/v1/products/${productId}/care-instructions`);

      const current = response.productCareInstructions || [];
      const currentIds = current.map(ci => ci.careInstructionId);

      // 2. Calcular diferenças
      const toAdd = careInstructionIds.filter(id => !currentIds.includes(id));
      const toRemove = current.filter(
        ci => !careInstructionIds.includes(ci.careInstructionId)
      );

      // 3. Remover os que não estão mais selecionados
      await Promise.all(
        toRemove.map(ci =>
          apiClient.delete(
            `/v1/products/${productId}/care-instructions/${ci.id}`
          )
        )
      );

      // 4. Adicionar os novos
      await Promise.all(
        toAdd.map((careInstructionId, index) =>
          apiClient.post(`/v1/products/${productId}/care-instructions`, {
            careInstructionId,
            order: currentIds.length + index,
          })
        )
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['products', productId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['products', productId, 'care-instructions'],
      });
    },
  });
}
