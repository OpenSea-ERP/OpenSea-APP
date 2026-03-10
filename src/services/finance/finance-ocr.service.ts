import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

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
      formData,
    );
  },

  async extractFromText(text: string): Promise<OcrExtractResult> {
    return apiClient.post<OcrExtractResult>(
      API_ENDPOINTS.FINANCE_ENTRIES.OCR_TEXT,
      { text },
    );
  },

  async getLastSupplierEntry(
    supplierName: string,
  ): Promise<SupplierSuggestion | null> {
    const params = new URLSearchParams({ supplierName });
    const response = await apiClient.get<{
      suggestion: SupplierSuggestion | null;
    }>(`${API_ENDPOINTS.FINANCE_ENTRIES.LAST_SUPPLIER}?${params.toString()}`);
    return response.suggestion;
  },
};
