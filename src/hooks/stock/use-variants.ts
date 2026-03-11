import { variantsService } from '@/services/stock';
import type {
  CreateVariantRequest,
  UpdateVariantRequest,
  VariantsQuery,
  VariantsResponse,
} from '@/types/stock';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  VARIANTS: ['variants'],
  VARIANTS_PAGINATED: (query?: VariantsQuery) => [
    'variants',
    'paginated',
    query,
  ],
  VARIANT: (id: string) => ['variants', id],
  VARIANTS_BY_PRODUCT: (productId: string) => [
    'variants',
    'product',
    productId,
  ],
} as const;

// GET /v1/variants - Lista todas as variantes (legacy)
export function useVariants() {
  return useQuery({
    queryKey: QUERY_KEYS.VARIANTS,
    queryFn: () => variantsService.listVariants(),
    staleTime: 30_000,
  });
}

// GET /v1/variants - Lista variantes com paginação e filtros
export function useVariantsPaginated(query?: VariantsQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.VARIANTS_PAGINATED(query),
    queryFn: () => variantsService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

// GET /v1/variants?productId=:productId - Lista variantes de um produto
export function useProductVariants(productId: string) {
  return useQuery<VariantsResponse>({
    queryKey: ['variants', 'product', productId],
    queryFn: () => variantsService.listVariants(productId),
    enabled: !!productId,
    staleTime: 0, // Dados são sempre considerados "stale" na abertura
    refetchOnMount: true, // Refetch quando o componente é montado
  });
}

// GET /v1/variants/:id - Busca uma variante específica
export function useVariant(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VARIANT(id),
    queryFn: () => variantsService.getVariant(id),
    enabled: !!id,
  });
}

// POST /v1/variants - Cria uma nova variante
export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVariantRequest) =>
      variantsService.createVariant(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VARIANTS });
      if (variables.productId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.VARIANTS_BY_PRODUCT(variables.productId),
        });
      }
    },
  });
}

// PATCH /v1/variants/:id - Atualiza uma variante
export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVariantRequest }) =>
      variantsService.updateVariant(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VARIANTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.VARIANT(variables.id),
      });
      // Invalidate product-specific variants if productId is available
      const productId = response.variant.productId;
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.VARIANTS_BY_PRODUCT(productId),
        });
      }
    },
  });
}

// DELETE /v1/variants/:id - Deleta uma variante
export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: string | { id: string; productId?: string }) => {
      const id = typeof params === 'string' ? params : params.id;
      return variantsService.deleteVariant(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VARIANTS });
      const productId =
        typeof variables === 'string' ? undefined : variables.productId;
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.VARIANTS_BY_PRODUCT(productId),
        });
      }
    },
  });
}
