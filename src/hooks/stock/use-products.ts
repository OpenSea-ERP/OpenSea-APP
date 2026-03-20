import { productsService } from '@/services/stock';
import type {
  CreateProductRequest,
  Product,
  ProductsQuery,
  UpdateProductRequest,
} from '@/types/stock';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';

export interface ProductsFilters {
  search?: string;
  templateId?: string;
  manufacturerId?: string;
  categoryId?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

const QUERY_KEYS = {
  PRODUCTS: ['products'],
  PRODUCTS_INFINITE: (filters?: ProductsFilters) => [
    'products',
    'infinite',
    filters,
  ],
  PRODUCTS_PAGINATED: (query?: ProductsQuery) => [
    'products',
    'paginated',
    query,
  ],
  PRODUCT: (id: string) => ['products', id],
} as const;

// GET /v1/products - Lista todos os produtos (legacy)
export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => productsService.listProducts(),
    staleTime: 30_000,
  });
}

// GET /v1/products - Lista produtos com paginação e filtros
export function useProductsPaginated(query?: ProductsQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS_PAGINATED(query),
    queryFn: () => productsService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

// GET /v1/products - Infinite scroll com filtros e sorting server-side
const PRODUCTS_PAGE_SIZE = 20;

export function useProductsInfinite(filters?: ProductsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.PRODUCTS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productsService.list({
        page: pageParam,
        limit: PRODUCTS_PAGE_SIZE,
        search: filters?.search || undefined,
        templateId: filters?.templateId || undefined,
        manufacturerId: filters?.manufacturerId || undefined,
        categoryId: filters?.categoryId || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  // Flatten pages into single array
  const products = result.data?.pages.flatMap(p => p.products) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    products,
    total,
  };
}

// GET /v1/products/:productId - Busca um produto específico
export function useProduct(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(productId),
    queryFn: () => productsService.getProduct(productId),
    enabled: !!productId,
  });
}

// POST /v1/products - Cria um novo produto
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      productsService.createProduct(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// PATCH /v1/products/:productId - Atualiza um produto
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: UpdateProductRequest;
    }) => productsService.updateProduct(productId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCT(variables.productId),
      });
    },
  });
}

// DELETE /v1/products/:productId - Deleta um produto
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => productsService.deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
