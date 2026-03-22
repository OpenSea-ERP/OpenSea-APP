import {
  brandService,
  catalogsService,
  contentService,
} from '@/services/sales';
import type {
  AddCatalogItemRequest,
  CreateCatalogRequest,
  CreateGeneratedContentRequest,
  UpdateBrandRequest,
  UpdateCatalogRequest,
} from '@/types/sales';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const QUERY_KEYS = {
  CATALOGS: ['catalogs'],
  CATALOG: (id: string) => ['catalogs', id],
  BRAND: ['brand'],
  CONTENTS: ['contents'],
  CONTENT: (id: string) => ['contents', id],
} as const;

// ============================================================================
// CATALOGS
// ============================================================================

export function useCatalogsInfinite(filters?: Record<string, string>) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.CATALOGS, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await catalogsService.listCatalogs({
        ...filters,
        page: String(pageParam),
        limit: '20',
      });
      return response;
    },
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useCatalog(catalogId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CATALOG(catalogId),
    queryFn: () => catalogsService.getCatalog(catalogId),
    enabled: !!catalogId,
  });
}

export function useCreateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCatalogRequest) =>
      catalogsService.createCatalog(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATALOGS });
    },
  });
}

export function useUpdateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      catalogId,
      data,
    }: {
      catalogId: string;
      data: UpdateCatalogRequest;
    }) => catalogsService.updateCatalog(catalogId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATALOGS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CATALOG(variables.catalogId),
      });
    },
  });
}

export function useDeleteCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catalogId: string) => catalogsService.deleteCatalog(catalogId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATALOGS });
    },
  });
}

export function useAddCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      catalogId,
      data,
    }: {
      catalogId: string;
      data: AddCatalogItemRequest;
    }) => catalogsService.addCatalogItem(catalogId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CATALOG(variables.catalogId),
      });
    },
  });
}

export function useRemoveCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      catalogId,
      itemId,
    }: {
      catalogId: string;
      itemId: string;
    }) => catalogsService.removeCatalogItem(catalogId, itemId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CATALOG(variables.catalogId),
      });
    },
  });
}

// ============================================================================
// BRAND
// ============================================================================

export function useBrand() {
  return useQuery({
    queryKey: QUERY_KEYS.BRAND,
    queryFn: () => brandService.getBrand(),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBrandRequest) => brandService.updateBrand(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BRAND });
    },
  });
}

// ============================================================================
// CONTENT
// ============================================================================

export function useContentsInfinite(filters?: Record<string, string>) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.CONTENTS, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await contentService.listContents({
        ...filters,
        page: String(pageParam),
        limit: '20',
      });
      return response;
    },
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.pages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useContent(contentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CONTENT(contentId),
    queryFn: () => contentService.getContent(contentId),
    enabled: !!contentId,
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeneratedContentRequest) =>
      contentService.generateContent(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENTS });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => contentService.deleteContent(contentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENTS });
    },
  });
}

export function useApproveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => contentService.approveContent(contentId),
    onSuccess: async (_, contentId) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTENTS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CONTENT(contentId),
      });
    },
  });
}
