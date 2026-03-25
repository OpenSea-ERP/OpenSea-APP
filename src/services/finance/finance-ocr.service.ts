import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { OcrBatchResult } from '@/types/finance';

// ============================================================================
// TYPES
// ============================================================================

export interface OcrExtractedData {
  valor?: number;
  vencimento?: string;
  beneficiario?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
}

export interface OcrExtractResult {
  rawText: string;
  extractedData: OcrExtractedData;
  confidence: number;
}

export interface SupplierSuggestion {
  categoryId: string;
  costCenterId?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const financeOcrService = {
  async uploadForOcr(file: File): Promise<OcrExtractResult> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<OcrExtractResult>(
      API_ENDPOINTS.FINANCE_ENTRIES.OCR_UPLOAD,
      formData
    );
  },

  async extractFromText(text: string): Promise<OcrExtractResult> {
    return apiClient.post<OcrExtractResult>(
      API_ENDPOINTS.FINANCE_ENTRIES.OCR_TEXT,
      { text }
    );
  },

  async ocrUploadBatch(files: File[]): Promise<OcrBatchResult> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiClient.post<OcrBatchResult>(
      API_ENDPOINTS.FINANCE_ENTRIES.OCR_UPLOAD_BATCH,
      formData
    );
  },

  async getLastSupplierEntry(
    supplierName: string
  ): Promise<SupplierSuggestion | null> {
    const params = new URLSearchParams({ supplierName });
    const response = await apiClient.get<{
      suggestion: SupplierSuggestion | null;
    }>(`${API_ENDPOINTS.FINANCE_ENTRIES.LAST_SUPPLIER}?${params.toString()}`);
    return response.suggestion;
  },
};
