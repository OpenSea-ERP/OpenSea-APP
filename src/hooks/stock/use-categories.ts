import { categoriesService } from '@/services/stock';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CATEGORIES: ['categories'],
  CATEGORY: (id: string) => ['categories', id],
} as const;

// GET /v1/categories - Lista todas as categorias
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => categoriesService.listCategories(),
  });
}

// GET /v1/categories/:id - Busca uma categoria específica
export function useCategory(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORY(id),
    queryFn: () => categoriesService.getCategory(id),
    enabled: !!id,
  });
}

// POST /v1/categories - Cria uma nova categoria
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      categoriesService.createCategory(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}

// PATCH /v1/categories/:id - Atualiza uma categoria
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesService.updateCategory(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CATEGORY(variables.id),
      });
    },
  });
}

// DELETE /v1/categories/:id - Deleta uma categoria
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesService.deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}

// PATCH /v1/categories/reorder - Reordena categorias em batch
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ id: string; displayOrder: number }>) =>
      categoriesService.reorderCategories(items),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}
