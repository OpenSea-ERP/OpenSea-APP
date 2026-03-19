import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ImportValidationRequest,
  ImportValidationResult,
  ImportRequest,
  ImportResult,
  ImportTemplateResponse,
  BatchEntryRequest,
  BatchTransferRequest,
  ItemEntryResponse,
  ItemTransferResponse,
  CreateVariantRequest,
  VariantResponse,
  BulkValidateRequest,
  BulkValidateResponse,
  BulkCreateProductsRequest,
  BulkCreateProductsResponse,
} from '@/types/stock';

export const importService = {
  // ============================================
  // VALIDATION
  // ============================================

  // POST /v1/import/validate
  async validate(
    data: ImportValidationRequest
  ): Promise<ImportValidationResult> {
    return apiClient.post<ImportValidationResult>(
      API_ENDPOINTS.IMPORT.VALIDATE,
      data
    );
  },

  // Convenience methods for specific types
  async validateProducts(
    data: Record<string, unknown>[]
  ): Promise<ImportValidationResult> {
    return this.validate({ type: 'PRODUCTS', data });
  },

  async validateVariants(
    data: Record<string, unknown>[]
  ): Promise<ImportValidationResult> {
    return this.validate({ type: 'VARIANTS', data });
  },

  async validateItems(
    data: Record<string, unknown>[]
  ): Promise<ImportValidationResult> {
    return this.validate({ type: 'ITEMS', data });
  },

  // ============================================
  // IMPORT
  // ============================================

  // POST /v1/import/products
  async importProducts(data: ImportRequest): Promise<ImportResult> {
    return apiClient.post<ImportResult>(API_ENDPOINTS.IMPORT.PRODUCTS, data);
  },

  // POST /v1/import/variants
  async importVariants(data: ImportRequest): Promise<ImportResult> {
    return apiClient.post<ImportResult>(API_ENDPOINTS.IMPORT.VARIANTS, data);
  },

  // POST /v1/import/items
  async importItems(data: ImportRequest): Promise<ImportResult> {
    return apiClient.post<ImportResult>(API_ENDPOINTS.IMPORT.ITEMS, data);
  },

  // ============================================
  // TEMPLATES
  // ============================================

  // GET /v1/import/templates/:type
  async getTemplate(
    type: 'products' | 'variants' | 'items'
  ): Promise<ImportTemplateResponse> {
    return apiClient.get<ImportTemplateResponse>(
      API_ENDPOINTS.IMPORT.TEMPLATE(type)
    );
  },

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  // POST /v1/variants/batch
  async batchCreateVariants(variants: CreateVariantRequest[]): Promise<{
    variants: VariantResponse[];
    errors: Array<{ index: number; message: string }>;
  }> {
    return apiClient.post<{
      variants: VariantResponse[];
      errors: Array<{ index: number; message: string }>;
    }>(API_ENDPOINTS.IMPORT.VARIANTS_BATCH, { variants });
  },

  // POST /v1/items/entry/batch
  async batchEntry(data: BatchEntryRequest): Promise<{
    items: ItemEntryResponse[];
    errors: Array<{ index: number; message: string }>;
  }> {
    return apiClient.post<{
      items: ItemEntryResponse[];
      errors: Array<{ index: number; message: string }>;
    }>(API_ENDPOINTS.IMPORT.ITEMS_ENTRY_BATCH, data);
  },

  // POST /v1/items/transfer/batch
  async batchTransfer(data: BatchTransferRequest): Promise<{
    transfers: ItemTransferResponse[];
    errors: Array<{ index: number; message: string }>;
  }> {
    return apiClient.post<{
      transfers: ItemTransferResponse[];
      errors: Array<{ index: number; message: string }>;
    }>(API_ENDPOINTS.IMPORT.ITEMS_TRANSFER_BATCH, data);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  // POST /v1/products/bulk/validate
  async bulkValidateProducts(
    data: BulkValidateRequest
  ): Promise<BulkValidateResponse> {
    return apiClient.post<BulkValidateResponse>(
      API_ENDPOINTS.IMPORT.PRODUCTS_BULK_VALIDATE,
      data
    );
  },

  // POST /v1/products/bulk
  async bulkCreateProducts(
    data: BulkCreateProductsRequest
  ): Promise<BulkCreateProductsResponse> {
    return apiClient.post<BulkCreateProductsResponse>(
      API_ENDPOINTS.IMPORT.PRODUCTS_BULK,
      data
    );
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  // Parse CSV to array of objects
  parseCSV(csv: string, delimiter: string = ','): Record<string, string>[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(delimiter)
      .map(h => h.trim().replace(/^"|"$/g, ''));
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(delimiter)
        .map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  },

  // Parse Excel-like tab-separated data (from clipboard)
  parseTabSeparated(text: string): Record<string, string>[] {
    return this.parseCSV(text, '\t');
  },

  // Dry run import (validate without actually importing)
  async dryRun(
    type: 'PRODUCTS' | 'VARIANTS' | 'ITEMS',
    data: Record<string, unknown>[]
  ): Promise<ImportResult> {
    const endpoint =
      type === 'PRODUCTS'
        ? API_ENDPOINTS.IMPORT.PRODUCTS
        : type === 'VARIANTS'
          ? API_ENDPOINTS.IMPORT.VARIANTS
          : API_ENDPOINTS.IMPORT.ITEMS;

    return apiClient.post<ImportResult>(endpoint, {
      type,
      data,
      options: { dryRun: true },
    });
  },
};
