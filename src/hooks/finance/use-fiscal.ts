import { fiscalService } from '@/services/finance';
import type {
  FiscalDocumentsQuery,
  FiscalDocumentType,
  FiscalDocumentStatus,
  UpdateFiscalConfigData,
  EmitNfeData,
  EmitNfceData,
  CancelDocumentData,
  CorrectionLetterData,
} from '@/types/fiscal';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ============================================================================
// FILTERS TYPE (for infinite scroll hooks)
// ============================================================================

export interface FiscalDocumentsFilters {
  search?: string;
  type?: FiscalDocumentType;
  status?: FiscalDocumentStatus;
  sortBy?: 'createdAt' | 'number' | 'totalValue' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const QUERY_KEYS = {
  FISCAL_CONFIG: ['fiscal', 'config'],
  FISCAL_DOCUMENTS: ['fiscal', 'documents'],
  FISCAL_DOCUMENTS_INFINITE: (filters?: FiscalDocumentsFilters) => [
    'fiscal',
    'documents',
    'infinite',
    filters,
  ],
  FISCAL_DOCUMENT: (id: string) => ['fiscal', 'documents', id],
} as const;

export { QUERY_KEYS as fiscalKeys };

// ============================================================================
// CONFIG QUERIES
// ============================================================================

export function useFiscalConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.FISCAL_CONFIG,
    queryFn: () => fiscalService.getConfig(),
  });
}

export function useUpdateFiscalConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFiscalConfigData) =>
      fiscalService.updateConfig(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_CONFIG,
      });
    },
  });
}

// ============================================================================
// DOCUMENT QUERIES
// ============================================================================

const FISCAL_PAGE_SIZE = 20;

export function useFiscalDocumentsInfinite(filters?: FiscalDocumentsFilters) {
  const result = useInfiniteQuery({
    queryKey: QUERY_KEYS.FISCAL_DOCUMENTS_INFINITE(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fiscalService.listDocuments({
        page: pageParam,
        perPage: FISCAL_PAGE_SIZE,
        search: filters?.search || undefined,
        type: filters?.type || undefined,
        status: filters?.status || undefined,
        sortBy: filters?.sortBy || undefined,
        sortOrder: filters?.sortOrder || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  // Flatten pages into single array
  const documents = result.data?.pages.flatMap(p => p.documents ?? []).filter(Boolean) ?? [];
  const total = result.data?.pages[0]?.meta.total ?? 0;

  return {
    ...result,
    documents,
    total,
  };
}

export function useFiscalDocument(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FISCAL_DOCUMENT(id),
    queryFn: () => fiscalService.getDocument(id),
    enabled: !!id,
  });
}

// ============================================================================
// EMIT MUTATIONS
// ============================================================================

export function useEmitNfe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmitNfeData) => fiscalService.emitNfe(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENTS,
      });
    },
  });
}

export function useEmitNfce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmitNfceData) => fiscalService.emitNfce(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENTS,
      });
    },
  });
}

// ============================================================================
// ACTION MUTATIONS
// ============================================================================

export function useCancelDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelDocumentData }) =>
      fiscalService.cancelDocument(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENTS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENT(variables.id),
      });
    },
  });
}

export function useCorrectionLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CorrectionLetterData }) =>
      fiscalService.correctionLetter(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENTS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_DOCUMENT(variables.id),
      });
    },
  });
}

// ============================================================================
// CERTIFICATE MUTATION
// ============================================================================

export function useUploadCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      fiscalService.uploadCertificate(file, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FISCAL_CONFIG,
      });
    },
  });
}
