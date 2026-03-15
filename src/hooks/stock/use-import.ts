import { importService } from '@/services/stock';
import type {
  ImportValidationRequest,
  ImportRequest,
  BatchEntryRequest,
  BatchTransferRequest,
  CreateVariantRequest,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export const IMPORT_QUERY_KEYS = {
  TEMPLATE: (type: string) => ['import-templates', type],
} as const;

// ============================================
// TEMPLATES
// ============================================

// GET /v1/import/templates/:type - Busca template de importação
export function useImportTemplate(type: 'products' | 'variants' | 'items') {
  return useQuery({
    queryKey: IMPORT_QUERY_KEYS.TEMPLATE(type),
    queryFn: () => importService.getTemplate(type),
    staleTime: Infinity, // Templates don't change often
  });
}

// ============================================
// VALIDATION
// ============================================

// POST /v1/import/validate - Valida dados para importação
export function useValidateImport() {
  return useMutation({
    mutationFn: (data: ImportValidationRequest) => importService.validate(data),
  });
}

// Convenience hooks for specific types
export function useValidateProductsImport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>[]) =>
      importService.validateProducts(data),
  });
}

export function useValidateVariantsImport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>[]) =>
      importService.validateVariants(data),
  });
}

export function useValidateItemsImport() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>[]) =>
      importService.validateItems(data),
  });
}

// ============================================
// IMPORT
// ============================================

// POST /v1/import/products - Importa produtos
export function useImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportRequest) => importService.importProducts(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// POST /v1/import/variants - Importa variantes
export function useImportVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportRequest) => importService.importVariants(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}

// POST /v1/import/items - Importa itens
export function useImportItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportRequest) => importService.importItems(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}

// ============================================
// BATCH OPERATIONS
// ============================================

// POST /v1/variants/batch - Cria variantes em lote
export function useBatchCreateVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variants: CreateVariantRequest[]) =>
      importService.batchCreateVariants(variants),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });
}

// POST /v1/items/entry/batch - Entrada de itens em lote
export function useBatchEntryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchEntryRequest) => importService.batchEntry(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['variants'] });
      await queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
  });
}

// POST /v1/items/transfer/batch - Transferência de itens em lote
export function useBatchTransferItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchTransferRequest) =>
      importService.batchTransfer(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
  });
}

// ============================================
// IMPORT WORKFLOW HOOK
// ============================================

type ImportType = 'PRODUCTS' | 'VARIANTS' | 'ITEMS';
type ImportStep = 'upload' | 'validate' | 'preview' | 'import' | 'complete';

interface UseImportWorkflowOptions {
  type: ImportType;
  onComplete?: () => void;
}

export function useImportWorkflow({
  type,
  onComplete,
}: UseImportWorkflowOptions) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [validationResult, setValidationResult] = useState<Awaited<
    ReturnType<typeof importService.validate>
  > | null>(null);
  const [importResult, setImportResult] = useState<Awaited<
    ReturnType<typeof importService.importProducts>
  > | null>(null);

  const validateMutation = useValidateImport();
  const importProductsMutation = useImportProducts();
  const importVariantsMutation = useImportVariants();
  const importItemsMutation = useImportItems();

  const uploadData = useCallback((data: Record<string, unknown>[]) => {
    setRawData(data);
    setStep('validate');
  }, []);

  const parseAndUpload = useCallback(
    (text: string, delimiter: string = '\t') => {
      const parsed = importService.parseCSV(text, delimiter);
      uploadData(parsed);
    },
    [uploadData]
  );

  const validate = useCallback(async () => {
    const result = await validateMutation.mutateAsync({ type, data: rawData });
    setValidationResult(result);
    setStep('preview');
    return result;
  }, [validateMutation, type, rawData]);

  const executeImport = useCallback(
    async (options?: ImportRequest['options']) => {
      setStep('import');

      const importData: ImportRequest = {
        type,
        data: rawData,
        options,
      };

      let result;
      switch (type) {
        case 'PRODUCTS':
          result = await importProductsMutation.mutateAsync(importData);
          break;
        case 'VARIANTS':
          result = await importVariantsMutation.mutateAsync(importData);
          break;
        case 'ITEMS':
          result = await importItemsMutation.mutateAsync(importData);
          break;
      }

      setImportResult(result);
      setStep('complete');
      onComplete?.();
      return result;
    },
    [
      type,
      rawData,
      importProductsMutation,
      importVariantsMutation,
      importItemsMutation,
      onComplete,
    ]
  );

  const dryRun = useCallback(async () => {
    return executeImport({ dryRun: true });
  }, [executeImport]);

  const reset = useCallback(() => {
    setStep('upload');
    setRawData([]);
    setValidationResult(null);
    setImportResult(null);
  }, []);

  const goBack = useCallback(() => {
    switch (step) {
      case 'validate':
        setStep('upload');
        break;
      case 'preview':
        setStep('validate');
        break;
      case 'import':
        setStep('preview');
        break;
      case 'complete':
        reset();
        break;
    }
  }, [step, reset]);

  return {
    step,
    rawData,
    validationResult,
    importResult,
    uploadData,
    parseAndUpload,
    validate,
    executeImport,
    dryRun,
    reset,
    goBack,
    isValidating: validateMutation.isPending,
    isImporting:
      importProductsMutation.isPending ||
      importVariantsMutation.isPending ||
      importItemsMutation.isPending,
    error:
      validateMutation.error ||
      importProductsMutation.error ||
      importVariantsMutation.error ||
      importItemsMutation.error,
  };
}
