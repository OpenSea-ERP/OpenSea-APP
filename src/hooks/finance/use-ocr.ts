'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  financeOcrService,
  type OcrExtractResult,
  type SupplierSuggestion,
} from '@/services/finance';
import { useEffect, useState } from 'react';

// ============================================================================
// MUTATIONS
// ============================================================================

export function useOcrExtract() {
  return useMutation<OcrExtractResult, Error, File>({
    mutationFn: (file: File) => financeOcrService.uploadForOcr(file),
  });
}

export function usePasteExtract() {
  return useMutation<OcrExtractResult, Error, string>({
    mutationFn: (text: string) => financeOcrService.extractFromText(text),
  });
}

// ============================================================================
// QUERY - LAST SUPPLIER ENTRY (debounced)
// ============================================================================

export function useLastSupplierEntry(supplierName: string) {
  const [debouncedName, setDebouncedName] = useState(supplierName);

  useEffect(() => {
    if (supplierName.length <= 2) {
      setDebouncedName('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedName(supplierName);
    }, 300);

    return () => clearTimeout(timer);
  }, [supplierName]);

  return useQuery<SupplierSuggestion | null>({
    queryKey: ['finance', 'last-supplier-entry', debouncedName],
    queryFn: () => financeOcrService.getLastSupplierEntry(debouncedName),
    enabled: debouncedName.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
